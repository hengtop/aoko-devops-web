import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  message,
  Select,
  Space,
} from "antd";
import { CREDENTIAL_TYPES, credentialTypeOptions } from "@constants";
import {
  createCredential,
  updateCredential,
  type CredentialRecord,
} from "@service/api";
import type { CredentialType } from "@constants";

interface CredentialDrawerProps {
  open: boolean;
  appId: string;
  editRecord?: CredentialRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormValues = {
  name: string;
  type: CredentialType;
  content?: string;
  description?: string;
  // docker_auth extra
  registry?: string;
  dockerUsername?: string;
  // password extra
  username?: string;
};

export default function CredentialDrawer({
  open,
  appId,
  editRecord,
  onClose,
  onSuccess,
}: CredentialDrawerProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [credType, setCredType] = useState<CredentialType | undefined>(undefined);

  const isEdit = !!editRecord;

  useEffect(() => {
    if (open) {
      if (editRecord) {
        form.setFieldsValue({
          name: editRecord.name,
          type: editRecord.type,
          description: editRecord.description,
        });
        setCredType(editRecord.type);
      } else {
        form.resetFields();
        setCredType(undefined);
      }
    }
  }, [open, editRecord]);

  function handleTypeChange(val: CredentialType) {
    setCredType(val);
    // 切换类型时清空内容相关字段，避免格式混淆
    form.resetFields(["content", "registry", "dockerUsername", "username"]);
  }

  function renderContentField() {
    if (!credType) return null;

    if (credType === CREDENTIAL_TYPES.GIT_TOKEN) {
      return (
        <Form.Item
          label="Token 内容"
          name="content"
          rules={isEdit ? [] : [{ required: true, message: "请输入 Token" }]}
          extra={isEdit ? "如需更新 Token 请重新填写，留空则保持不变" : undefined}
        >
          <Input.Password placeholder="请输入 Personal Access Token" />
        </Form.Item>
      );
    }

    if (credType === CREDENTIAL_TYPES.SSH_KEY) {
      return (
        <Form.Item
          label="SSH 私钥"
          name="content"
          rules={isEdit ? [] : [{ required: true, message: "请粘贴 SSH 私钥" }]}
          extra={isEdit ? "如需更新私钥请重新填写，留空则保持不变" : undefined}
        >
          <Input.TextArea
            rows={6}
            placeholder={"-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"}
          />
        </Form.Item>
      );
    }

    if (credType === CREDENTIAL_TYPES.DOCKER_AUTH) {
      return (
        <>
          <Form.Item
            label="Registry 地址"
            name="registry"
            rules={isEdit ? [] : [{ required: true, message: "请输入 Registry 地址" }]}
            extra={isEdit ? "如需更新请重新填写，留空则保持不变" : undefined}
          >
            <Input placeholder="如 registry.example.com" />
          </Form.Item>
          <Form.Item
            label="用户名"
            name="dockerUsername"
            rules={isEdit ? [] : [{ required: true, message: "请输入用户名" }]}
          >
            <Input placeholder="Docker 仓库用户名" />
          </Form.Item>
          <Form.Item
            label="密码 / Token"
            name="content"
            rules={isEdit ? [] : [{ required: true, message: "请输入密码或 Token" }]}
          >
            <Input.Password placeholder="Docker 仓库密码或访问 Token" />
          </Form.Item>
        </>
      );
    }

    if (credType === CREDENTIAL_TYPES.KUBECONFIG) {
      return (
        <Form.Item
          label="Kubeconfig 内容"
          name="content"
          rules={isEdit ? [] : [{ required: true, message: "请粘贴 Kubeconfig YAML" }]}
          extra={isEdit ? "如需更新请重新填写，留空则保持不变" : undefined}
        >
          <Input.TextArea rows={8} placeholder={"apiVersion: v1\nclusters:\n..."} />
        </Form.Item>
      );
    }

    if (credType === CREDENTIAL_TYPES.PASSWORD) {
      return (
        <>
          <Form.Item
            label="用户名"
            name="username"
            rules={isEdit ? [] : [{ required: true, message: "请输入用户名" }]}
            extra={isEdit ? "如需更新请重新填写，留空则保持不变" : undefined}
          >
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="content"
            rules={isEdit ? [] : [{ required: true, message: "请输入密码" }]}
          >
            <Input.Password placeholder="密码" />
          </Form.Item>
        </>
      );
    }

    return null;
  }

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      // 组装 extraConfig
      let extraConfig: Record<string, unknown> | undefined;
      if (values.type === CREDENTIAL_TYPES.DOCKER_AUTH && values.registry) {
        extraConfig = { registry: values.registry, username: values.dockerUsername };
      } else if (values.type === CREDENTIAL_TYPES.PASSWORD && values.username) {
        extraConfig = { username: values.username };
      }

      if (isEdit) {
        const id = editRecord!.id ?? editRecord!._id ?? "";
        const payload: Record<string, unknown> = {
          id,
          name: values.name,
          type: values.type,
          description: values.description,
        };
        if (values.content) payload.content = values.content;
        if (extraConfig) payload.extraConfig = extraConfig;

        const res = await updateCredential(payload as any);
        if (res.success) {
          message.success("凭据更新成功");
          onSuccess();
          onClose();
        } else {
          message.error(Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "更新失败"));
        }
      } else {
        const res = await createCredential({
          applicationId: appId,
          name: values.name,
          type: values.type,
          content: values.content ?? "",
          description: values.description,
          extraConfig,
        });
        if (res.success) {
          message.success("凭据创建成功");
          onSuccess();
          onClose();
        } else {
          message.error(Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "创建失败"));
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      title={isEdit ? "编辑凭据" : "新增凭据"}
      open={open}
      onClose={onClose}
      width={560}
      destroyOnClose
      footer={
        <Space>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            确定
          </Button>
          <Button onClick={onClose}>取消</Button>
        </Space>
      }
    >
      {isEdit && (
        <Alert
          type="warning"
          showIcon
          message="凭据内容（密钥/Token/密码）不会回填显示，如需更新请在对应字段重新填写，留空则保持不变。"
          style={{ marginBottom: 20 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <Form.Item
          label="凭据名称"
          name="name"
          rules={[{ required: true, message: "请输入凭据名称" }]}
        >
          <Input placeholder="如 gitlab-deploy-token" />
        </Form.Item>

        <Form.Item
          label="凭据类型"
          name="type"
          rules={[{ required: true, message: "请选择凭据类型" }]}
        >
          <Select
            placeholder="选择凭据类型"
            options={credentialTypeOptions}
            onChange={handleTypeChange}
            disabled={isEdit}
          />
        </Form.Item>

        {renderContentField()}

        <Form.Item label="描述" name="description">
          <Input.TextArea rows={2} placeholder="凭据用途说明（选填）" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
