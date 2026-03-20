import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.less";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className={styles.forbiddenPage}>
      <div className={styles.pageGlow} aria-hidden="true" />
      <div className={styles.pageGrid} aria-hidden="true" />

      <div className={styles.resultPanel}>
        <Result
          status="403"
          title="403"
          subTitle="当前账号没有访问这个页面的权限。"
          extra={
            <Button type="primary" size="large" onClick={() => navigate("/dashboard")}>
              返回控制台
            </Button>
          }
        />
      </div>
    </div>
  );
}
