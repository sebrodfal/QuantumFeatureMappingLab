export function HeatmapLegend() {
  return (
    <div className="heatmap-legend">
      <span>Inverse</span>
      <span className="legend-number">−1</span>
      <div className="heatmap-gradient" />
      <span className="legend-number">+1</span>
      <span>Direct</span>
    </div>
  );
}
