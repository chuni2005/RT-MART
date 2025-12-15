import Icon from "@/shared/components/Icon";
import styles from "./FAQItem.module.scss";

interface FAQItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isExpanded, onToggle }: FAQItemProps) {
  return (
    <div className={styles.faqItem}>
      <button className={styles.question} onClick={onToggle}>
        <Icon
          icon={isExpanded ? "chevron-down" : "chevron-right"}
          className={styles.icon}
        />
        <span className={styles.questionText}>{question}</span>
      </button>
      <div className={`${styles.answer} ${isExpanded ? styles.expanded : ""}`}>
        <div className={styles.answerContent}>
          <b className={styles.answerLabel}>答：</b>
          {answer}
        </div>
      </div>
    </div>
  );
}

export default FAQItem;
