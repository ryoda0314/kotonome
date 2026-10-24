import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { LetterHost } from "@/components/LetterSheet";
import { SyncOnce } from "@/components/SyncOnce";
import { ja } from "@/lib/i18n/ja";
import styles from "./app.module.css";

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className={styles.shell}>
      <LetterHost>
        <main className={styles.main}>{children}</main>
      </LetterHost>
      <BottomNav labels={ja.nav} brand={<Logo size="sm" href="/" />} />
      <SyncOnce />
    </div>
  );
}
