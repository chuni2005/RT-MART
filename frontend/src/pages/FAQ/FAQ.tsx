import { useState } from "react";
import styles from "./FAQ.module.scss";
import FAQItem from "./components/FAQItem";
import { faqData } from "./faqData";

function FAQ() {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const handleToggle = (id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id]
    );
  };

  return (
    <div className={styles.faq}>
      <div className={styles.container}>
        <h1 className={styles.title}>常見問題</h1>
        <div className={styles.faqList}>
          {faqData.map((item) => (
            <FAQItem
              key={item.id}
              question={item.question}
              answer={item.answer}
              isExpanded={expandedIds.includes(item.id)}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default FAQ;
