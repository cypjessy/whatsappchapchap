"use client";

import { useEffect, useRef, useCallback } from "react";

interface SalesData {
  date: string;
  sales: number;
  orders?: number;
}

interface MobileSalesChartProps {
  data: SalesData[];
  height?: number;
}

export function MobileSalesChart({ data, height = 200 }: MobileSalesChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle device pixel ratio for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const chartHeight = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, chartHeight);

    // Chart dimensions
    const padding = { top: 20, right: 10, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const maxSales = Math.max(...data.map((d) => d.sales), 0);
    const minSales = Math.min(...data.map((d) => d.sales), 0);
    const range = maxSales - minSales || 1;

    // Helper: format currency
    const formatCurrency = (value: number): string => {
      if (value >= 1000) return `KES ${(value / 1000).toFixed(1)}k`;
      return `KES ${value}`;
    };

    // Helper: get point coordinates
    const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartWidth;
    const getY = (value: number) => padding.top + innerHeight - ((value - minSales) / range) * innerHeight;

    // Draw grid lines
    ctx.strokeStyle = "#e2e8f0";
    ctx.setLineDash([3, 3]);
    ctx.lineWidth = 1;

    // 5 grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (innerHeight / 4) * i;
      const value = maxSales - (range / 4) * i;

      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Y-axis labels
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(formatCurrency(value), padding.left - 6, y + 3);
    }
    ctx.setLineDash([]);

    // Draw X-axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px system-ui, sans-serif";
    ctx.textAlign = "center";

    data.forEach((d, i) => {
      const x = getX(i);
      ctx.fillText(d.date, x, chartHeight - 8);
    });

    // Draw area fill gradient
    const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + innerHeight);
    gradient.addColorStop(0, "rgba(37, 211, 102, 0.15)");
    gradient.addColorStop(1, "rgba(37, 211, 102, 0)");

    ctx.beginPath();
    ctx.moveTo(getX(0), getY(data[0].sales));

    // Smooth curve using quadratic bezier
    for (let i = 0; i < data.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getY(data[i].sales);
      const x1 = getX(i + 1);
      const y1 = getY(data[i + 1].sales);
      const cpX = (x0 + x1) / 2;
      ctx.quadraticCurveTo(x0, y0, cpX, (y0 + y1) / 2);
    }

    // Close path for fill
    const lastX = getX(data.length - 1);
    const lastY = getY(data[data.length - 1].sales);
    ctx.quadraticCurveTo(lastX, lastY, lastX, lastY);
    ctx.lineTo(lastX, padding.top + innerHeight);
    ctx.lineTo(getX(0), padding.top + innerHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    ctx.moveTo(getX(0), getY(data[0].sales));

    for (let i = 0; i < data.length - 1; i++) {
      const x0 = getX(i);
      const y0 = getY(data[i].sales);
      const x1 = getX(i + 1);
      const y1 = getY(data[i + 1].sales);
      const cpX = (x0 + x1) / 2;
      ctx.quadraticCurveTo(x0, y0, cpX, (y0 + y1) / 2);
    }

    ctx.quadraticCurveTo(lastX, lastY, lastX, lastY);
    ctx.strokeStyle = "#25D366";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw dots
    data.forEach((d, i) => {
      const x = getX(i);
      const y = getY(d.sales);

      // White border
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();

      // Green fill
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#25D366";
      ctx.fill();
    });

    // Draw peak reference line
    const peakY = getY(maxSales);
    ctx.beginPath();
    ctx.moveTo(padding.left, peakY);
    ctx.lineTo(width - padding.right, peakY);
    ctx.strokeStyle = "rgba(37, 211, 102, 0.3)";
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);

    // Peak label
    ctx.fillStyle = "#25D366";
    ctx.font = "bold 10px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Peak", width - padding.right - 30, peakY - 6);

  }, [data, height]);

  useEffect(() => {
    drawChart();

    // Redraw on resize
    const handleResize = () => drawChart();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawChart]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full block"
      style={{ height: `${height}px` }}
    />
  );
}
