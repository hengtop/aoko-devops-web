import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Form, Input, message, Radio, Select, Space, Typography } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import { buildAppDetailPath } from "@constants";
import { createApplication, listProducts, type ProductRecord } from "@service/api";
import styles from "./styles.module.less";

// 公司默认 Git 服务域名前缀，后端统一配置
const DEFAULT_REPO_PREFIX = "https://gitlab.example.com/";

const { Title, Text } = Typography;

type RepoMode = "default" | "existing";

type FormValues = {
  productId: string;
  name: string;
  code: string;
  repoMode: RepoMode;
  repoCode?: string;   // 默认模式：code 部分
  repo_url?: string;   // 已有仓库模式：完整地址
  description?: string;
  structure?: string;
  level?: string;
};

const STRUCTURE_OPTIONS = [
  { value: "frontend", label: "前端" },
  { value: "backend", label: "后端" },
  { value: "microservice", label: "微服务" },
  { value: "fullstack", label: "全栈" },
  { value: "other", label: "其他" },
];

const LEVEL_OPTIONS = [
  { value: "P0", label: "P0 - 核心" },
  { value: "P1", label: "P1 - 重要" },
  { value: "P2", label: "P2 - 一般" },
  { value: "P3", label: "P3 - 低优先" },
];

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AppCreate() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [repoMode, setRepoMode] = useState<RepoMode>("default");

  const defaultProductId = searchParams.get("productId") ?? undefined;

  useEffect(() => {
    async function loadProducts() {
      setLoadingProducts(true);
      const res = await listProducts({ pageNum: 1, pageSize: 100 });
      if (res.success) {
        setProducts(res.data?.list ?? []);
      }
      setLoadingProducts(false);
    }
    loadProducts();
  }, []);

  useEffect(() => {
    if (defaultProductId) {
      form.setFieldValue("productId", defaultProductId);
    }
  }, [defaultProductId, form]);

  function getProductId(p: ProductRecord) {
    return p.id ?? p._id ?? "";
  }

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);

    const repoUrl =
      values.repoMode === "default"
        ? `${DEFAULT_REPO_PREFIX}${values.repoCode ?? values.code}`
        : (values.repo_url ?? "");

    const res = await createApplication({
      tenantId: "default",
      productId: values.productId,
      name: values.name,
      code: values.code,
      repo_url: repoUrl,
      description: values.description,
      structure: values.structure,
      level: values.level,
    });

    if (res.success) {
      message.success("应用创建成功");
      const appId = res.data?.id ?? res.data?._id ?? "";
      if (appId) {
        navigate(buildAppDetailPath(appId));
      } else {
        navigate(-1);
      }
    } else {
      const msg = Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "创建失败");
      message.error(msg);
    }
    setSubmitting(false);
  }

  return (
    <div className={styles.layout}>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
        </aside>
        <div className={styles.main}>
          <div className={styles.header}>
            <Button type="text" size="small" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
              返回
            </Button>
          </div>

        <div className={styles.formContainer}>
          <div className={styles.formTitle}>
            <Title level={4} style={{ margin: 0 }}>
              创建应用
            </Title>
            <Text type="secondary">应用对应一个可独立部署的代码仓库</Text>
          </div>

          <Card className={styles.formCard}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
              initialValues={{ repoMode: "default" }}
            >
              <Form.Item
                label="所属产品线"
                name="productId"
                rules={[{ required: true, message: "请选择所属产品线" }]}
              >
                <Select
                  placeholder="选择产品线"
                  loading={loadingProducts}
                  options={products.map((p) => ({
                    value: getProductId(p),
                    label: p.name,
                  }))}
                  showSearch
                  filterOption={(input, opt) =>
                    String(opt?.label ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                />
              </Form.Item>

              <Form.Item
                label="应用名称"
                name="name"
                rules={[{ required: true, message: "请输入应用名称" }]}
              >
                <Input
                  placeholder="例如：用户中台"
                  onChange={(e) => {
                    const code = slugify(e.target.value);
                    if (code) {
                      form.setFieldValue("code", code);
                      form.setFieldValue("repoCode", code);
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                label="应用 Code"
                name="code"
                rules={[
                  { required: true, message: "请输入应用 Code" },
                  {
                    pattern: /^[a-z0-9-]+$/,
                    message: "仅支持小写字母、数字和连字符",
                  },
                ]}
                extra="应用唯一标识，创建后不可修改"
              >
                <Input
                  placeholder="例如：user-center"
                  onChange={(e) => form.setFieldValue("repoCode", e.target.value)}
                />
              </Form.Item>

              <Form.Item label="仓库配置方式" name="repoMode">
                <Radio.Group
                  onChange={(e) => setRepoMode(e.target.value)}
                  options={[
                    { value: "default", label: "自动创建（使用公司默认 Git 服务）" },
                    { value: "existing", label: "已有仓库（粘贴仓库地址）" },
                  ]}
                />
              </Form.Item>

              {repoMode === "default" && (
                <Form.Item
                  label="仓库 Code"
                  name="repoCode"
                  rules={[{ required: true, message: "请输入仓库 Code" }]}
                  extra={
                    <span>
                      最终仓库地址：
                      <Typography.Text code style={{ fontSize: 12 }}>
                        {DEFAULT_REPO_PREFIX}{form.getFieldValue("repoCode") || "<code>"}
                      </Typography.Text>
                    </span>
                  }
                >
                  <Input addonBefore={<span style={{ color: "#999", fontSize: 12 }}>{DEFAULT_REPO_PREFIX}</span>} placeholder="与应用 Code 相同，可修改" />
                </Form.Item>
              )}

              {repoMode === "existing" && (
                <Form.Item
                  label="仓库地址"
                  name="repo_url"
                  rules={[{ required: true, message: "请输入仓库地址" }]}
                  extra="凭证可在创建后到「应用设置 → 仓库配置」中绑定"
                >
                  <Input placeholder="https://github.com/org/repo.git" />
                </Form.Item>
              )}

              <Form.Item label="应用描述" name="description">
                <Input.TextArea rows={3} placeholder="简要描述应用的功能" />
              </Form.Item>

              <Form.Item label="应用架构" name="structure">
                <Select
                  placeholder="选择应用架构类型"
                  options={STRUCTURE_OPTIONS}
                  allowClear
                />
              </Form.Item>

              <Form.Item label="应用等级" name="level" extra="按照业务重要性分级">
                <Select
                  placeholder="选择应用等级"
                  options={LEVEL_OPTIONS}
                  allowClear
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Space>
                  <Button type="primary" htmlType="submit" loading={submitting}>
                    创建应用
                  </Button>
                  <Button onClick={() => navigate(-1)}>取消</Button>
                </Space>
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
