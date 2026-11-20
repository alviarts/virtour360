export const tourConfig = {
  /** Sudut pandang default saat panorama selesai dimuat */
  defaultZoom: 70,
  minFov: 30,
  maxFov: 100,
  /** Kecepatan transition antar scene */
  transitionSpeed: "18rpm",
  /** Tampilkan panah navigasi 3D antar scene */
  renderMode: "3d" as const,
  /** Loading overlay */
  loadingLabel: "Menyiapkan panorama…",
}
