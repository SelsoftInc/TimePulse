'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/contexts/ThemeContext';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const MonthlyRevenueChart = ({ data = [], labels = [], height = 200 }) => {
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const chartOptions = {
    chart: {
      type: 'area',
      height: height,
      fontFamily: 'Inter, system-ui, sans-serif',
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 3,
      colors: ['#3b82f6'],
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 90, 100],
        colorStops: [
          {
            offset: 0,
            color: '#3b82f6',
            opacity: 0.7,
          },
          {
            offset: 100,
            color: '#3b82f6',
            opacity: 0.1,
          },
        ],
      },
    },
    grid: {
      show: true,
      borderColor: isDark ? '#374151' : '#e5e7eb',
      strokeDashArray: 4,
      position: 'back',
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
      padding: {
        top: 0,
        right: 10,
        bottom: 0,
        left: 10,
      },
    },
    xaxis: {
      categories: labels,
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
          fontSize: '11px',
          fontWeight: 500,
        },
        rotate: 0,
        trim: true,
      },
      axisBorder: {
        show: true,
        color: isDark ? '#374151' : '#e5e7eb',
      },
      axisTicks: {
        show: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDark ? '#9ca3af' : '#6b7280',
          fontSize: '11px',
          fontWeight: 500,
        },
        formatter: function (value) {
          if (value >= 1000000) {
            return '$' + (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            return '$' + (value / 1000).toFixed(0) + 'K';
          }
          return '$' + value.toFixed(0);
        },
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    tooltip: {
      enabled: true,
      theme: isDark ? 'dark' : 'light',
      x: {
        show: true,
        formatter: function (value, { dataPointIndex }) {
          return labels[dataPointIndex] || value;
        },
      },
      y: {
        formatter: function (value) {
          return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);
        },
        title: {
          formatter: () => 'Revenue:',
        },
      },
      marker: {
        show: true,
      },
      style: {
        fontSize: '12px',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
    },
    markers: {
      size: 0,
      colors: ['#3b82f6'],
      strokeColors: '#fff',
      strokeWidth: 2,
      hover: {
        size: 6,
        sizeOffset: 3,
      },
    },
    legend: {
      show: false,
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 180,
          },
          xaxis: {
            labels: {
              style: {
                fontSize: '10px',
              },
            },
          },
          yaxis: {
            labels: {
              style: {
                fontSize: '10px',
              },
            },
          },
        },
      },
    ],
  };

  const chartSeries = [
    {
      name: 'Revenue',
      data: data,
    },
  ];

  if (!isMounted) {
    return (
      <div
        style={{
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
        }}
      >
        Loading chart...
      </div>
    );
  }

  return (
    <div className="monthly-revenue-chart">
      <Chart
        options={chartOptions}
        series={chartSeries}
        type="area"
        height={height}
      />
    </div>
  );
};

export default MonthlyRevenueChart;
