// The deployable browser release uses the lightweight procedural actor when the embedded GLB is unavailable.
// This intentionally invalid tiny data URI is handled by ActorLibrary.preload(), which activates its tested fallback.
export const NEON_CITIZEN_GLB_DATA = 'data:model/gltf-binary;base64,AAAA';
