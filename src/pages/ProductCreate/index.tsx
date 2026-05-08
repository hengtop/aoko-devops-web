import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Button,
  Card,
  Form,
  Input,
  message,
  Space,
  Typography,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import { APP_ROUTE_PATHS, buildProductDetailPath } from "@constants";
import { createProduct, getProductDetail, updateProduct } from "@service/api";
import styles from "./styles.module.less";

const { Title, Text } = Typography;

type FormValues = {
  name: string;
  code: string;
  description?: string;
};

export default function ProductCreate() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  // 编辑模式：回填数据
  useEffect(() => {
    if (!id) return;
    getProductDetail({ id }).then((res) => {
      if (res.success && res.data) {
        form.setFieldsValue({
          name: res.data.name,
          code: res.data.code,
          description: res.data.description,
        });
      }
    });
  }, [id, form]);

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      if (isEdit && id) {
        const res = await updateProduct({
          id,
          name: values.name,
          description: values.description,
        });
        if (res.success) {
          message.success("产品更新成功");
          navigate(buildProductDetailPath(id));
        } else {
          const msg = Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "更新失败");
          message.error(msg);
        }
      } else {
        const res = await createProduct({
          tenantId: "default",
          name: values.name,
          code: values.code,
          description: values.description,
        });
        if (res.success) {
          message.success("产品创建成功");
          navigate(APP_ROUTE_PATHS.PRODUCT);
        } else {
          const msg = Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "创建失败");
          message.error(msg);
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.layout}>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
        </aside>
        <main className={styles.main}>
        <div className={styles.header}>
          <Button
            type="text"
            size="small"
            icon={<ArrowLeftOutlined />}
            onClick={() => (isEdit && id ? navigate(buildProductDetailPath(id)) : navigate(APP_ROUTE_PATHS.PRODUCT))}
          >
            返回
          </Button>
        </div>

        <div className={styles.formContainer}>
          <div className={styles.formTitle}>
            <Title level={4} style={{ margin: 0 }}>
              {isEdit ? "编辑产品" : "创建产品"}
            </Title>
            <Text type="secondary">产品是应用的集合，一个产品线下可以创建多个应用</Text>
          </div>

          <Card className={styles.formCard}>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
            >
              <Form.Item
                label="产品名称"
                name="name"
                rules={[{ required: true, message: "请输入产品名称" }]}
              >
                <Input placeholder="例如：电商平台" />
              </Form.Item>

              <Form.Item
                label="产品 Code"
                name="code"
                rules={[
                  { required: true, message: "请输入产品 Code" },
                  {
                    pattern: /^[a-z0-9-]+$/,
                    message: "仅支持小写字母、数字和连字符",
                  },
                ]}
                extra={isEdit ? "产品 Code 创建后不可修改" : "用于系统标识，创建后不可修改，建议使用英文小写"}
              >
                <Input placeholder="例如：ecommerce-platform" disabled={isEdit} />
              </Form.Item>

              <Form.Item label="描述" name="description">
                <Input.TextArea
                  placeholder="简要描述这个产品的定位和用途"
                  rows={3}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                  >
                    {isEdit ? "保存修改" : "创建产品"}
                  </Button>
                  <Button onClick={() => (isEdit && id ? navigate(buildProductDetailPath(id)) : navigate(APP_ROUTE_PATHS.PRODUCT))}>
                    取消
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
