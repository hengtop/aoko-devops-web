import { Card, Col, Descriptions, Row, Typography } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import type { ApplicationRecord } from "@service/api";
import styles from "./styles.module.less";

const { Text } = Typography;

type Props = {
  app: ApplicationRecord;
};

export default function TabOverview({ app }: Props) {
  return (
    <div className={styles.tabContent}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Card title="基本信息" variant="borderless">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="名称">{app.name}</Descriptions.Item>
              <Descriptions.Item label="Code">{app.code}</Descriptions.Item>
              <Descriptions.Item label="架构">{app.structure ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="等级">{app.level ?? "—"}</Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {app.description ?? "—"}
              </Descriptions.Item>
              <Descriptions.Item label="仓库地址" span={2}>
                <a
                  href={app.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <LinkOutlined style={{ marginRight: 4 }} />
                  <Text ellipsis style={{ maxWidth: 380 }}>
                    {app.repo_url}
                  </Text>
                </a>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="快速操作" variant="borderless">
            <div className={styles.quickActions}>
              <Text type="secondary" style={{ fontSize: 13 }}>
                在「迭代」标签页创建新的迭代版本，
                在「流水线」标签页配置构建和发布流程。
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
