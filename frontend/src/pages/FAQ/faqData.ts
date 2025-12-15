export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export const faqData: FAQItem[] = [
  {
    id: "1",
    question: "如何下單購買商品？",
    answer: "選擇商品後點擊「加入購物車」或「立即購買」，填寫收件資訊和付款方式即可完成訂單。",
  },
  {
    id: "2",
    question: "如何追蹤訂單？",
    answer: "登入後前往「我的訂單」頁面，可以查看所有訂單狀態和物流資訊。",
  },
  {
    id: "3",
    question: "付款方式有哪些？",
    answer: "我們支援信用卡和貨到付款兩種付款方式。",
  },
  {
    id: "4",
    question: "運費如何計算？",
    answer: "運費依本公司設定而定，部分商品可能有免運優惠。結帳時會顯示詳細運費資訊。",
  },
  {
    id: "5",
    question: "如何聯繫客服？",
    answer: "您可以透過頁面底部的聯絡資訊與我們聯繫，或直接與賣家溝通。",
  },
  {
    id: "6",
    question: "為什麼我看到的資料不對或沒更新？",
    answer: "別擔心！這通常是瀏覽器快取的問題。請按 F5 重新整理頁面，資料就會更新了。如果還是不行，可以試試 Ctrl+F5 強制重新整理。",
  },
];
