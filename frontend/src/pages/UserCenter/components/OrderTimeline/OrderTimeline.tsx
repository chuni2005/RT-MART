import Icon from '@/shared/components/Icon';
import styles from './OrderTimeline.module.scss';

import { OrderTimelineProps, TimelineStep } from '@/types/userCenter';

function OrderTimeline({ timestamps }: OrderTimelineProps) {
  // 定義時間軸步驟
  const steps: TimelineStep[] = [
    { label: '訂單成立', key: 'createdAt', isCompleted: true, timestamp: timestamps.createdAt },
    { label: '付款完成', key: 'paidAt', isCompleted: !!timestamps.paidAt, timestamp: timestamps.paidAt },
    { label: '商品出貨', key: 'shippedAt', isCompleted: !!timestamps.shippedAt, timestamp: timestamps.shippedAt },
    { label: '商品送達', key: 'deliveredAt', isCompleted: !!timestamps.deliveredAt, timestamp: timestamps.deliveredAt },     
    { label: '交易完成', key: 'completedAt', isCompleted: !!timestamps.completedAt, timestamp: timestamps.completedAt },   
  ];

  return (
    <div className={styles.timeline}>
      {steps.map((step, index) => (
        <div
          key={step.key}
          className={`${styles.timelineItem} ${
            step.isCompleted ? styles.completed : ''
          }`}
        >
          {/* 圓點 */}
          <div className={styles.dot}>
            {step.isCompleted && <Icon icon="check-circle" />}
          </div>

          {/* 連接線 */}
          {index < steps.length - 1 && (
            <div className={styles.line} />
          )}

          {/* 標籤與時間 */}
          <div className={styles.content}>
            <p className={styles.label}>{step.label}</p>
            {step.timestamp && (
              <p className={styles.timestamp}>
                {new Date(step.timestamp).toLocaleString('zh-TW')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default OrderTimeline;
