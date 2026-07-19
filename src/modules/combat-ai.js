import * as THREE from 'three';

export function buildCoverPoints(collisionBoxes) {
  const points = [];
  for (const box of collisionBoxes) {
    const cx = (box.minX + box.maxX) / 2;
    const cz = (box.minZ + box.maxZ) / 2;
    const pad = 1.35;
    const xs = [box.minX - pad, box.maxX + pad];
    const zs = [box.minZ - pad, box.maxZ + pad];
    xs.forEach(x => { points.push(new THREE.Vector3(x, 0, cz - 1.7), new THREE.Vector3(x, 0, cz + 1.7)); });
    zs.forEach(z => { points.push(new THREE.Vector3(cx - 1.7, 0, z), new THREE.Vector3(cx + 1.7, 0, z)); });
  }
  return points;
}

export function chooseCoverPoint(origin, target, points, collidesAt, maxDistance = 28) {
  let best = null;
  let bestScore = Infinity;
  for (const point of points) {
    const fromEnemy = point.distanceTo(origin);
    if (fromEnemy > maxDistance || collidesAt(point.x, point.z, .42)) continue;
    const fromTarget = point.distanceTo(target);
    if (fromTarget < 7) continue;
    const score = fromEnemy + Math.abs(fromTarget - 18) * .18;
    if (score < bestScore) { bestScore = score; best = point; }
  }
  return best?.clone() ?? null;
}

export function moveToward2D(object, target, speed, dt, collidesAt, radius = .45) {
  const delta = new THREE.Vector3().copy(target).sub(object.position);
  delta.y = 0;
  const distance = delta.length();
  if (distance < .001) return distance;
  delta.normalize();
  const nx = object.position.x + delta.x * speed * dt;
  const nz = object.position.z + delta.z * speed * dt;
  if (!collidesAt(nx, object.position.z, radius)) object.position.x = nx;
  if (!collidesAt(object.position.x, nz, radius)) object.position.z = nz;
  object.rotation.y = Math.atan2(delta.x, delta.z);
  return distance;
}
