import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, Form, Input, message, Select, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import { APP_ROUTE_PATHS, buildAppDetailPath } from "@constants";
import { createRelease, getApplicationDetail, listRepositories, type RepositoryRecord } from "@service/api";
import styles from "./styles.module.less";

const { Title, Text } = Typography;

type FormValues = {
  version: string;
  title: string;
  branch: string;
  description?: string;
  repositoryId?: string;
};

export default function ReleaseCreate() {
  const navigate = useNavigate();
  const { appId = "" } = useParams<{ appId: string }>();
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [repos, setRepos] = useState<RepositoryRecord[]>([]);
  const [productId, setProductId] = useState("");

  useEffect(() => {
    if (appId) {
      listRepositories({ applicationId: appId, pageNum: 1, pageSize: 50 }).then((res) => {
        if (res.success) setRepos(res.data?.list ?? []);
      });
      getApplicationDetail({ id: appId }).then((res) => {
        if (res.success && res.data) setProductId(res.data.productId ?? "");
      });
    }
  }, [appId]);

  async function handleSubmit(values: FormValues) {
    if (!appId) return;
    setSubmitting(true);
    const res = await createRelease({
      applicationId: appId,
      tenantId: "default",
      productId,
      version: values.version,
      title: values.title,
      description: values.description,
      currentStage: "DEV",
      git: { branch: values.branch, commitHash: "" },
    });
    setSubmitting(false);
    if (res.success) {
      message.success("迭代创建成功");
      navigate(appId ? buildAppDetailPath(appId) + "?tab=releases" : APP_ROUTE_PATHS.PRODUCT);
    }
  }

  return (
    <div className={styles.pageLayout}>
      <div className={styles.pageBody}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
        </aside>
        <div className={styles.pageMain}>
          <div className={styles.pageContent}>
          <div className={styles.pageHeader}>
            <Button
              type="text"
              icon={<ArrowLeftOutlined />}
              onClick={() => (appId ? navigate(buildAppDetailPath(appId)) : navigate(-1))}
            >
              返回
            </Button>
            <Title level={4} style={{ margin: 0 }}>
              创建迭代
            </Title>
          </div>

          <Card className={styles.formCard}>
            <Text type="secondary" style={{ display: "block", marginBottom: 20 }}>
              迭代（Release）是应用的一次发布单元，包含代码版本与部署流程。
            </Text>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              style={{ maxWidth: 560 }}
            >
              <Form.Item
                label="版本号"
                name="version"
                rules={[
                  { required: true, message: "请输入版本号" },
                  { pattern: /^[a-zA-Z0-9._-]+$/, message: "仅支持字母、数字、点、短线" },
                ]}
              >
                <Input placeholder="例如 v1.2.0" />
              </Form.Item>

              <Form.Item label="标题" name="title" rules={[{ required: true, message: "请输入迭代标题" }]}>
                <Input placeholder="简要描述本次迭代内容" />
              </Form.Item>

              <Form.Item
                label="构建分支"
                name="branch"
                rules={[{ required: true, message: "请输入分支名称" }]}
              >
                <Input placeholder="例如 main、release/v1.2" />
              </Form.Item>

              {repos.length > 0 && (
                <Form.Item label="关联仓库" name="repositoryId">
                  <Select placeholder="选择仓库（可选）" allowClear>
                    {repos.map((r) => (
                      <Select.Option key={r.id ?? r._id} value={r.id ?? r._id}>
                        {r.repoName}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              )}

              <Form.Item label="描述" name="description">
                <Input.TextArea rows={3} placeholder="选填，本次迭代的说明" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={submitting}>
                  创建迭代
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}
