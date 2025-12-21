import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ChartDataPoint } from '@/types/admin';
import styles from './Charts.module.scss';

interface UserGrowthBarChartProps {
  data: ChartDataPoint[];
}

function UserGrowthBarChart({ data }: UserGrowthBarChartProps) {
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
        text: '平台用戶增長趨勢',
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
          return `${param.name}<br/>新增用戶: ${param.value.toLocaleString()} 人`;
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
        name: '新增用戶數',
        nameTextStyle: {
          fontSize: 12,
        },
        axisLabel: {
          formatter: (value: number) => `${value.toLocaleString()}`,
          fontSize: 12,
        },
      },
      series: [
        {
          name: '新增用戶',
          type: 'bar',
          data: data.map((d) => d.value),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#10b981' },
              { offset: 1, color: '#34d399' },
            ]),
          },
          barWidth: '60%',
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

export default UserGrowthBarChart;
