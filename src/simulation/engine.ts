import { DEG2RAD, G, airDensity, angleDiff, jinkHash } from "./physics";
import type { SimulationParams, SimulationResult, SimulationStep } from "../types/simulation";

export function runSimulation({
  target,
  interceptor,
  launchDistance,
  launchAngle,
  detectionDelay,
  targetAltitude,
  windSpeed,
  windAngle,
  temperature,
  evasion = "none",
  seed = 0,
}: SimulationParams): SimulationResult {
  const dt = 0.02;
  const maxTime = 300;
  const steps: SimulationStep[] = [];

  const launchAngleRad = launchAngle * DEG2RAD;
  const windAngleRad = windAngle * DEG2RAD;
  const windVelX = windSpeed * Math.cos(windAngleRad);
  const windVelY = windSpeed * Math.sin(windAngleRad);

  const massKg = interceptor.mass / 1000;
  const thrustNewtons = (interceptor.thrust / 1000) * G;
  const maxMotorAccel = thrustNewtons / massKg;
  const topSpeed = interceptor.topSpeed;
  const dragCoefficientArea = interceptor.dragArea;
  const killRadius = 2 + interceptor.payload / 50;
  const NAV_CONSTANT = 4;

  //turn rate limit in rad/s
  const maxTurnRateRad = (interceptor.maxTurnRate || 540) * DEG2RAD;
  //structural g-limit
  const maxStructuralG = interceptor.maxGLoad || 8;
  const gOverloadThreshold = maxStructuralG;
  let sustainedGOverloadTime = 0;
  //0.5s sustained overload = failure
  const sustainedGFailureTime = 0.5;

  //80% usable capacity
  const batteryJoules =
    interceptor.cells * 3.7 * (interceptor.battery / 1000) * 3600 * 0.8;
  let energyUsedJoules = 0;

  let targetX = 0;
  let targetY = targetAltitude;
  let targetVelX = target.speed + windVelX;
  let targetVelY = 0;

  let interceptorX = -launchDistance * Math.cos(launchAngleRad);
  let interceptorY = 0;
  let interceptorVelX = 0;
  let interceptorVelY = 0;

  let prevLosAngle: number | null = null;
  //exponential moving average of target velocity for lead prediction
  let filteredTargetVelX = target.speed + windVelX;
  let filteredTargetVelY = 0;
  const velFilterAlpha = 0.02; //slow filter to smooth out evasion
  let intercepted = false;
  let interceptTime: number | null = null;
  let interceptPoint: { x: number; y: number } | null = null;
  let closureSpeed = 0;
  let maxGLoad = 0;
  let peakSpeed = 0;
  let time = 0;
  let stepAccumulator = 0;
  let structuralFailure = false;
  let structuralFailureTime: number | null = null;

  while (time < maxTime) {
    const hasLaunched = time >= detectionDelay;

    targetVelX = target.speed + windVelX;
    targetVelY = 0;

    if (evasion === "jinking") {
      const phase = Math.floor(time * 0.6) + seed;
      targetVelY = (jinkHash(phase) - 0.5) * 28;
      targetVelX = target.speed + windVelX + (jinkHash(phase + 100) - 0.5) * 16;
    } else if (evasion === "sturns") {
      targetVelY = 12 * Math.sin(time * 0.9 + seed);
    } else if (evasion === "dive" && time > detectionDelay + 2) {
      targetVelY = -8;
    } else if (evasion === "climb" && time > detectionDelay + 2) {
      targetVelY = 6;
    }

    let currentGLoad = 0;

    if (hasLaunched && !structuralFailure) {
      const deltaX = targetX - interceptorX;
      const deltaY = targetY - interceptorY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance < killRadius) {
        intercepted = true;
        interceptTime = time;
        interceptPoint = {
          x: (targetX + interceptorX) / 2,
          y: (targetY + interceptorY) / 2,
        };
        const relativeVelX = interceptorVelX - targetVelX;
        const relativeVelY = interceptorVelY - targetVelY;
        closureSpeed = Math.sqrt(
          relativeVelX * relativeVelX + relativeVelY * relativeVelY
        );
        break;
      }

      //drag: F = 0.5 * rho * CdA * v^2
      const airRelativeVelX = interceptorVelX - windVelX;
      const airRelativeVelY = interceptorVelY - windVelY;
      const airSpeed = Math.sqrt(
        airRelativeVelX * airRelativeVelX + airRelativeVelY * airRelativeVelY
      );
      const rho = airDensity(interceptorY, temperature);
      const dragAccel =
        (0.5 * rho * dragCoefficientArea * airSpeed * airSpeed) / massKg;

      let dragAccelX = 0;
      let dragAccelY = 0;
      if (airSpeed > 0.1) {
        dragAccelX = (-dragAccel * airRelativeVelX) / airSpeed;
        dragAccelY = (-dragAccel * airRelativeVelY) / airSpeed;
      }

      //filter target velocity to avoid chasing evasion oscillations
      filteredTargetVelX += (targetVelX - filteredTargetVelX) * velFilterAlpha;
      filteredTargetVelY += (targetVelY - filteredTargetVelY) * velFilterAlpha;

      //lead-pursuit using filtered velocity
      const currentSpeed = Math.sqrt(
        interceptorVelX * interceptorVelX + interceptorVelY * interceptorVelY
      );
      const estimatedClosingSpeed = Math.max(
        currentSpeed + topSpeed * 0.5,
        topSpeed * 0.5
      );
      const estimatedTimeToIntercept = distance / estimatedClosingSpeed;

      const leadDeltaX =
        targetX + filteredTargetVelX * estimatedTimeToIntercept - interceptorX;
      const leadDeltaY =
        targetY + filteredTargetVelY * estimatedTimeToIntercept - interceptorY;
      const leadDistance = Math.sqrt(
        leadDeltaX * leadDeltaX + leadDeltaY * leadDeltaY
      );

      const desiredVelX = (leadDeltaX / leadDistance) * topSpeed;
      const desiredVelY = (leadDeltaY / leadDistance) * topSpeed;
      const velocityErrorX = desiredVelX - interceptorVelX;
      const velocityErrorY = desiredVelY - interceptorVelY;
      const velocityErrorMagnitude = Math.sqrt(
        velocityErrorX * velocityErrorX + velocityErrorY * velocityErrorY
      );

      //15% thrust reserved for maneuvering
      const maneuverBudget = maxMotorAccel * 0.85;
      let commandAccelX = 0;
      let commandAccelY = 0;
      if (velocityErrorMagnitude > 0.01) {
        const accelMagnitude = Math.min(maneuverBudget, velocityErrorMagnitude / dt);
        commandAccelX = (velocityErrorX / velocityErrorMagnitude) * accelMagnitude;
        commandAccelY = (velocityErrorY / velocityErrorMagnitude) * accelMagnitude;
      }

      //proportional navigation — always active, not just close range
      const losAngle = Math.atan2(deltaY, deltaX);
      if (prevLosAngle !== null) {
        const losRate = angleDiff(losAngle, prevLosAngle) / dt;
        const closingVelocity =
          -(
            (deltaX * (interceptorVelX - targetVelX) +
              deltaY * (interceptorVelY - targetVelY)) /
            distance
          );
        const pnAccel = NAV_CONSTANT * Math.max(closingVelocity, 5) * losRate;
        //pn active at all ranges, full authority below 1000m
        const pnWeight = Math.min(1, 1000 / Math.max(distance, 1));
        commandAccelX += pnAccel * -Math.sin(losAngle) * pnWeight;
        commandAccelY += pnAccel * Math.cos(losAngle) * pnWeight;
      }
      prevLosAngle = losAngle;

      //gravity compensation + motor clamp
      const totalCommandX = commandAccelX;
      const totalCommandY = commandAccelY + G;
      const commandMagnitude = Math.sqrt(
        totalCommandX * totalCommandX + totalCommandY * totalCommandY
      );

      let motorAccelX: number;
      let motorAccelY: number;
      if (commandMagnitude > maxMotorAccel) {
        const scaleFactor = maxMotorAccel / commandMagnitude;
        motorAccelX = totalCommandX * scaleFactor;
        motorAccelY = totalCommandY * scaleFactor;
      } else {
        motorAccelX = totalCommandX;
        motorAccelY = totalCommandY;
      }

      //turn rate limiting
      if (currentSpeed > 1) {
        const currentHeading = Math.atan2(interceptorVelY, interceptorVelX);
        const netAccelXRaw = motorAccelX + dragAccelX;
        const netAccelYRaw = motorAccelY - G + dragAccelY;
        const newVelX = interceptorVelX + netAccelXRaw * dt;
        const newVelY = interceptorVelY + netAccelYRaw * dt;
        const desiredHeading = Math.atan2(newVelY, newVelX);

        let headingChange = angleDiff(desiredHeading, currentHeading);
        const maxHeadingChange = maxTurnRateRad * dt;

        if (Math.abs(headingChange) > maxHeadingChange) {
          headingChange = Math.sign(headingChange) * maxHeadingChange;
          const clampedHeading = currentHeading + headingChange;
          const newSpeed = Math.sqrt(newVelX * newVelX + newVelY * newVelY);

          const clampedVelX = Math.cos(clampedHeading) * newSpeed;
          const clampedVelY = Math.sin(clampedHeading) * newSpeed;
          motorAccelX = (clampedVelX - interceptorVelX) / dt - dragAccelX;
          motorAccelY = (clampedVelY - interceptorVelY) / dt - dragAccelY + G;
        }
      }

      currentGLoad =
        Math.sqrt(motorAccelX * motorAccelX + motorAccelY * motorAccelY) / G;
      if (currentGLoad > maxGLoad) {
        maxGLoad = currentGLoad;
      }

      //structural g-limit check
      if (currentGLoad > gOverloadThreshold) {
        sustainedGOverloadTime += dt;
        if (sustainedGOverloadTime >= sustainedGFailureTime) {
          structuralFailure = true;
          structuralFailureTime = time;
        }
      } else {
        sustainedGOverloadTime = Math.max(0, sustainedGOverloadTime - dt * 2);
      }

      //power draw: thrust^1.5 prop efficiency
      const thrustFraction = Math.min(
        1,
        Math.sqrt(motorAccelX * motorAccelX + motorAccelY * motorAccelY) /
          maxMotorAccel
      );
      energyUsedJoules +=
        Math.pow(thrustFraction, 1.5) * interceptor.maxPower * dt;

      const netAccelX = motorAccelX + dragAccelX;
      const netAccelY = motorAccelY - G + dragAccelY;
      interceptorVelX += netAccelX * dt;
      interceptorVelY += netAccelY * dt;

      //20% overspeed clamp
      const speed = Math.sqrt(
        interceptorVelX * interceptorVelX + interceptorVelY * interceptorVelY
      );
      if (speed > topSpeed * 1.2) {
        const clampFactor = (topSpeed * 1.2) / speed;
        interceptorVelX *= clampFactor;
        interceptorVelY *= clampFactor;
      }
      if (speed > peakSpeed) {
        peakSpeed = speed;
      }

      interceptorX += interceptorVelX * dt;
      interceptorY += interceptorVelY * dt;

      if (interceptorY < 0) {
        interceptorY = 0;
        interceptorVelY = Math.max(0, interceptorVelY);
      }
    } else if (hasLaunched && structuralFailure) {
      //ballistic: drag + gravity only
      const airRelativeVelX = interceptorVelX - windVelX;
      const airRelativeVelY = interceptorVelY - windVelY;
      const airSpeed = Math.sqrt(
        airRelativeVelX * airRelativeVelX + airRelativeVelY * airRelativeVelY
      );
      const rho = airDensity(interceptorY, temperature);
      const dragAccel =
        (0.5 * rho * dragCoefficientArea * airSpeed * airSpeed) / massKg;

      let dragAccelX = 0;
      let dragAccelY = 0;
      if (airSpeed > 0.1) {
        dragAccelX = (-dragAccel * airRelativeVelX) / airSpeed;
        dragAccelY = (-dragAccel * airRelativeVelY) / airSpeed;
      }

      interceptorVelX += dragAccelX * dt;
      interceptorVelY += (-G + dragAccelY) * dt;
      interceptorX += interceptorVelX * dt;
      interceptorY += interceptorVelY * dt;

      currentGLoad = 0;

      if (interceptorY <= 0) {
        interceptorY = 0;
        break;
      }
    }

    targetX += targetVelX * dt;
    targetY = Math.max(5, targetY + targetVelY * dt);

    //record at ~10hz
    stepAccumulator += dt;
    if (stepAccumulator >= 0.1 - dt * 0.5) {
      stepAccumulator = 0;
      steps.push({
        t: time,
        tx: targetX,
        ty: targetY,
        ix: interceptorX,
        iy: interceptorY,
        launched: hasLaunched,
        dist: Math.sqrt(
          (targetX - interceptorX) ** 2 + (targetY - interceptorY) ** 2
        ),
        iSpeed: Math.sqrt(
          interceptorVelX * interceptorVelX +
            interceptorVelY * interceptorVelY
        ),
        gLoad: currentGLoad,
        batteryPct: Math.max(
          0,
          (1 - energyUsedJoules / batteryJoules) * 100
        ),
      });
    }

    time += dt;

    if (targetX > launchDistance * 10 || targetX < -launchDistance * 2) break;
    if (energyUsedJoules >= batteryJoules) break;
  }

  return {
    steps,
    intercepted,
    interceptTime,
    interceptPoint,
    closureSpeed,
    killRadius,
    maxG: maxGLoad,
    peakSpeed,
    energyUsedJ: energyUsedJoules,
    batteryJ: batteryJoules,
    structuralFailure,
    structuralFailureTime,
  };
}
