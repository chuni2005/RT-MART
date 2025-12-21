import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ChartDataPoint } from '@/types/admin';
import styles from './Charts.module.scss';

interface OrderStatusPieChartProps {
  data: ChartDataPoint[];
}

function OrderStatusPieChart({ data }: OrderStatusPieChartProps) {
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
        text: '訂單狀態分布',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/>數量: ${params.value.toLocaleString()} 筆<br/>佔比: ${params.percent}%`;
        },
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          fontSize: 12,
        },
      },
      series: [
        {
          name: '訂單狀態',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: true,
            formatter: '{b}: {d}%',
            fontSize: 12,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold',
            },
          },
          labelLine: {
            show: true,
          },
          data: data.map((d) => ({
            name: d.label,
            value: d.value,
          })),
        },
      ],
      color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'],
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

export default OrderStatusPieChart;
