'use client';

import React from 'react';
import "./ChartWidget.css";

const ChartWidget = ({
  title,
  data,
  labels,
  type = "bar",
  height = 200,
  color = "#007bff",
  showValues = true,
  showLegend = false,
  onClick,
  employeeData = null, // Add employee data prop for click handlers
}) => {
  const renderBarChart = () => {
    // Handle both old format (array of objects) and new format (array of series)
    const isMultiSeries =
      Array.isArray(data) && data.length > 0 && data[0].data;

    if (isMultiSeries) {
      // Multi-series bar chart (stacked)
      const allValues = data.flatMap((series) => series.data);
      const maxValue = Math.max(...allValues);
      const seriesCount = data.length;

      return (
        <div className="chart-container" style={{ height: `${height}px` }}>
          <div className="chart-bars">
            {labels.map((label, index) => (
              <div key={index} className="chart-bar-wrapper">
                <div className="chart-bar-container">
                  <div className="chart-bar-stack">
                    {data.map((series, seriesIndex) => {
                      const value = series.data[index] || 0;
                      const heightPercent = (value / maxValue) * 100;
                      const previousValues = data
                        .slice(0, seriesIndex)
                        .reduce((sum, s) => sum + (s.data[index] || 0), 0);
                      const previousHeightPercent =
                        (previousValues / maxValue) * 100;

                      return (
                        <div
                          key={seriesIndex}
                          className="chart-bar"
                          style={{
                            height: `${heightPercent}%`,
                            backgroundColor: series.color || color,
                            position: "absolute",
                            bottom: `${previousHeightPercent}%`,
                            width: "100%",
                            cursor: onClick ? "pointer" : "default"}}
                          title={`${series.label}: ${value}`}
                          onClick={() =>
                            onClick &&
                            onClick({
                              activePayload: [
                                {
                                  payload: {
                                    id: employeeData?.[index]?.id,
                                    name: employeeData?.[index]?.name,
                                    value: value,
                                    label: series.label}},
                              ]})
                          }
                        >
                          {showValues && value > 0 && (
                            <span className="chart-value">{value}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="chart-label">{label}</span>
                </div>
              </div>
            ))}
          </div>
          {showLegend && (
            <div className="chart-legend">
              {data.map((series, index) => (
                <div key={index} className="chart-legend-item">
                  <div
                    className="chart-legend-color"
                    style={{ backgroundColor: series.color || color }}
                  ></div>
                  <span>{series.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      // Single series bar chart (original format)
      const chartData = data.map((item, index) => ({
        label: item.label || labels?.[index] || `Item ${index + 1}`,
        value: item.value || item,
        color: item.color || color}));

      const maxValue = Math.max(...chartData.map((item) => item.value));

      return (
        <div className="chart-container" style={{ height: `${height}px` }}>
          <div className="chart-bars">
            {chartData.map((item, index) => (
              <div key={index} className="chart-bar-wrapper">
                <div className="chart-bar-container">
                  <div
                    className="chart-bar"
                    style={{
                      height: `${(item.value / maxValue) * 100}%`,
                      backgroundColor: item.color}}
                    title={`${item.label}: ${item.value}`}
                  >
                    {showValues && (
                      <span className="chart-value">{item.value}</span>
                    )}
                  </div>
                  <span className="chart-label">{item.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  const renderLineChart = () => {
    // Handle both old format (array of objects) and new format (array of series)
    const isMultiSeries =
      Array.isArray(data) && data.length > 0 && data[0].data;

    if (isMultiSeries) {
      // Multi-series line chart
      const allValues = data.flatMap((series) => series.data);
      const maxValue = Math.max(...allValues);
      const minValue = Math.min(...allValues);
      const range = maxValue - minValue;

      return (
        <div className="chart-container" style={{ height: `${height}px` }}>
          <div className="line-chart">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {data.map((series, seriesIndex) => {
                const points = series.data
                  .map((value, index) => {
                    const x = (index / (series.data.length - 1)) * 100;
                    const y =
                      range > 0 ? 100 - ((value - minValue) / range) * 100 : 50;
                    return `${x},${y}`;
                  })
                  .join(" ");

                return (
                  <g key={seriesIndex}>
                    <polyline
                      fill="none"
                      stroke={series.color || color}
                      strokeWidth="2"
                      points={points}
                      className="line-path"
                    />
                    {series.data.map((value, pointIndex) => {
                      const x = (pointIndex / (series.data.length - 1)) * 100;
                      const y =
                        range > 0
                          ? 100 - ((value - minValue) / range) * 100
                          : 50;
                      return (
                        <circle
                          key={pointIndex}
                          cx={x}
                          cy={y}
                          r="2"
                          fill={series.color || color}
                          className="line-point"
                        />
                      );
                    })}
                  </g>
                );
              })}
            </svg>
            <div className="line-labels">
              {labels?.map((label, index) => (
                <div key={index} className="line-label">
                  {label}
                </div>
              ))}
            </div>
          </div>
          {showLegend && (
            <div className="chart-legend">
              {data.map((series, index) => (
                <div key={index} className="chart-legend-item">
                  <div
                    className="chart-legend-color"
                    style={{ backgroundColor: series.color || color }}
                  ></div>
                  <span>{series.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      // Single series line chart (original format)
      const chartData = data.map((item, index) => ({
        label: item.label || labels?.[index] || `Item ${index + 1}`,
        value: item.value || item,
        color: item.color || color}));

      const maxValue = Math.max(...chartData.map((item) => item.value));
      const minValue = Math.min(...chartData.map((item) => item.value));
      const range = maxValue - minValue;

      const points = chartData
        .map((item, index) => {
          const x = (index / (chartData.length - 1)) * 100;
          const y =
            range > 0 ? 100 - ((item.value - minValue) / range) * 100 : 50;
          return `${x},${y}`;
        })
        .join(" ");

      return (
        <div className="chart-container" style={{ height: `${height}px` }}>
          <div className="line-chart">
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke={color}
                strokeWidth="2"
                points={points}
                className="line-path"
              />
              {chartData.map((item, index) => {
                const x = (index / (chartData.length - 1)) * 100;
                const y =
                  range > 0
                    ? 100 - ((item.value - minValue) / range) * 100
                    : 50;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="2"
                    fill={color}
                    className="line-point"
                  />
                );
              })}
            </svg>
            <div className="line-labels">
              {chartData.map((item, index) => (
                <div key={index} className="line-label">
                  {item.label}
                  {showValues && (
                    <span className="line-value">{item.value}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
  };

  const renderPieChart = () => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="chart-container" style={{ height: `${height}px` }}>
        <div className="pie-chart">
          <svg width="100%" height="100%" viewBox="0 0 100 100">
            {data.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const startAngle = (cumulativePercentage / 100) * 360;
              const endAngle =
                ((cumulativePercentage + percentage) / 100) * 360;

              const x1 =
                50 + 40 * Math.cos(((startAngle - 90) * Math.PI) / 180);
              const y1 =
                50 + 40 * Math.sin(((startAngle - 90) * Math.PI) / 180);
              const x2 = 50 + 40 * Math.cos(((endAngle - 90) * Math.PI) / 180);
              const y2 = 50 + 40 * Math.sin(((endAngle - 90) * Math.PI) / 180);

              const largeArcFlag = percentage > 50 ? 1 : 0;
              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                "Z",
              ].join(" ");

              cumulativePercentage += percentage;

              return (
                <path
                  key={index}
                  d={pathData}
                  fill={item.color || color}
                  className="pie-segment"
                  title={`${item.label}: ${item.value} (${percentage.toFixed(
                    1
                  )}%)`}
                />
              );
            })}
          </svg>
          {showLegend && (
            <div className="pie-legend">
              {data.map((item, index) => (
                <div key={index} className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: item.color || color }}
                  ></div>
                  <span className="legend-label">{item.label}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case "line":
        return renderLineChart();
      case "pie":
        return renderPieChart();
      case "bar":
      default:
        return renderBarChart();
    }
  };

  return (
    <div className="chart-widget">
      {title && <h4 className="chart-title">{title}</h4>}
      {renderChart()}
    </div>
  );
};

export default ChartWidget;
