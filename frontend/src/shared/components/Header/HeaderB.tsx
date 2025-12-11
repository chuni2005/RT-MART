import LanguageMenu from "./LanguageMenu";
import Logo from "./Logo";
import styles from "./HeaderB.module.scss";

function HeaderB() {
  return (
    <header className={styles.headerB}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Logo */}
          <Logo variant="with-text" className={styles.whiteLogo} />

          {/* Language Menu */}
          <LanguageMenu
            variant="default"
            classNames={{
              icon: styles.whiteIcon,
              trigger: styles.whiteTrigger,
              chevron: styles.whiteChevron,
              optionActive: styles.whiteOptionActive,
            }}
          />
        </div>
      </div>
    </header>
  );
}

export default HeaderB;
