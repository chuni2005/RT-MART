import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { ChartDataPoint } from '@/types/seller';
import styles from './CategoryPieChart.module.scss';

interface CategoryPieChartProps {
  data: ChartDataPoint[];
}

function CategoryPieChart({ data }: CategoryPieChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 初始化圖表
    if (!chartInstanceRef.current) {
      chartInstanceRef.current = echarts.init(chartRef.current);
    }

    const chart = chartInstanceRef.current;

    // 配置選項 - 圓餅圖
    const option: echarts.EChartsOption = {
      title: {
        text: '商品類別銷售佔比',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 600
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `${params.name}<br/>營業額: NT$ ${params.value.toLocaleString()}<br/>佔比: ${params.percent}%`;
        }
      },
      legend: {
        orient: 'vertical',
        left: 'left',
        top: 'middle',
        textStyle: {
          fontSize: 12
        }
      },
      series: [
        {
          name: '營業額',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderColor: '#fff',
          },
          label: {
            show: true,
            formatter: '{b}: {d}%',
            fontSize: 12
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: true
          },
          data: data.map(d => ({
            name: d.label,
            value: d.value
          }))
        }
      ]
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
  }, [data]);

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

export default CategoryPieChart;
