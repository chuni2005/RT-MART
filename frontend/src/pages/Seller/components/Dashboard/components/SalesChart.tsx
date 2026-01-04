import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { SalesPeriod, ChartDataPoint } from '@/types/seller';
import styles from './SalesChart.module.scss';

interface SalesChartProps {
  data: ChartDataPoint[];
  period: SalesPeriod;
}

function SalesChart({ data, period }: SalesChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化圖表
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const chart = chartInstanceRef.current;

    // 配置選項
    const option: echarts.EChartsOption = {
      title: {
        text: '營業額趨勢',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 600
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const param = params[0];
          return `${param.name}<br/>營業額: NT$ ${param.value.toLocaleString()}`;
        }
      },
      xAxis: {
        type: 'category',
        data: data.map(d => d.label),
        axisLabel: {
          rotate: period === 'month' ? 45 : 0,
          fontSize: 12
        }
      },
      yAxis: {
        type: 'value',
        name: '營業額 (NT$)',
        nameTextStyle: {
          fontSize: 12
        },
        axisLabel: {
          formatter: (value: number) => `${(value / 1000).toFixed(0)}k`,
          fontSize: 12
        }
      },
      series: [
        {
          name: '營業額',
          type: 'line',
          data: data.map(d => d.value),
          smooth: true,
          lineStyle: {
            width: 3,
            color: '#ff6b35'
          },
          itemStyle: {
            color: '#ff6b35'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(255, 107, 53, 0.3)' },
              { offset: 1, color: 'rgba(255, 107, 53, 0.05)' }
            ])
          }
        }
      ],
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      }
    };

    chart.setOption(option);

    // 響應式調整
    const handleResize = () => {
      chart.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, period]);

  // 清理圖表實例
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

export default SalesChart;
