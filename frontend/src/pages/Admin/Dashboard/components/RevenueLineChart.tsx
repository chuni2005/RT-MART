import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ChartDataPoint } from '@/types/admin';
import styles from './Charts.module.scss';

interface RevenueLineChartProps {
  data: ChartDataPoint[];
}

function RevenueLineChart({ data }: RevenueLineChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const chart = chartInstanceRef.current;

    const option: echarts.EChartsOption = {
      title: {
        text: '平台交易額趨勢',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const param = params[0];
          return `${param.name}<br/>交易額: NT$ ${param.value.toLocaleString()}`;
        },
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.label),
        axisLabel: {
          rotate: 45,
          fontSize: 12,
        },
      },
      yAxis: {
        type: 'value',
        name: '交易額 (NT$)',
        nameTextStyle: {
          fontSize: 12,
        },
        axisLabel: {
          formatter: (value: number) => `${(value / 1000).toFixed(0)}k`,
          fontSize: 12,
        },
      },
      series: [
        {
          name: '交易額',
          type: 'line',
          data: data.map((d) => d.value),
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#3b82f6',
          },
          itemStyle: {
            color: '#3b82f6',
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ]),
          },
        },
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        containLabel: true,
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0,
          end: 100,
        },
        {
          type: 'slider',
          start: 0,
          end: 100,
          height: 20,
          bottom: '5%',
        },
      ],
    };

    chart.setOption(option);

    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={chartRef} className={styles.chart} />;
}

export default RevenueLineChart;
