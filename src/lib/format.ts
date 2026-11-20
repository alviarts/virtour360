export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

export const round = (value: number, digits = 0) => {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}

/** Ubah derajat yaw menjadi format tampilan seperti "90" / "-108" */
export const formatAngle = (value: number) => String(Math.round(value))
