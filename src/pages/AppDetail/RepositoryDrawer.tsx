import { useEffect, useState } from "react";
import { Button, Drawer, Form, Input, message, Select, Space } from "antd";
import {
  repositoryProviderOptions,
  repositoryAuthTypeOptions,
} from "@constants";
import {
  createRepository,
  updateRepository,
  listCredentials,
  type RepositoryRecord,
  type CredentialRecord,
} from "@service/api";

interface RepositoryDrawerProps {
  open: boolean;
  appId: string;
  editRecord?: RepositoryRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

type FormValues = {
  repoName: string;
  providerType: string;
  repoUrl: string;
  sshUrl?: string;
  defaultBranch: string;
  authType: string;
  credentialId?: string;
  webhookSecret?: string;
};

export default function RepositoryDrawer({
  open,
  appId,
  editRecord,
  onClose,
  onSuccess,
}: RepositoryDrawerProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [credentials, setCredentials] = useState<CredentialRecord[]>([]);

  const isEdit = !!editRecord;

  useEffect(() => {
    if (open) {
      if (editRecord) {
        form.setFieldsValue({
          repoName: editRecord.repoName,
          providerType: editRecord.providerType,
          repoUrl: editRecord.repoUrl,
          sshUrl: editRecord.sshUrl,
          defaultBranch: editRecord.defaultBranch,
          authType: editRecord.authType,
          credentialId: editRecord.credentialId,
          webhookSecret: editRecord.webhookSecret,
        });
      } else {
        form.resetFields();
        form.setFieldValue("defaultBranch", "main");
      }
      loadCredentials();
    }
  }, [open, editRecord]);

  async function loadCredentials() {
    const res = await listCredentials({ applicationId: appId, pageNum: 1, pageSize: 100 });
    if (res.success) {
      setCredentials(res.data?.list ?? []);
    }
  }

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      if (isEdit) {
        const id = editRecord!.id ?? editRecord!._id ?? "";
        const res = await updateRepository({ id, ...values } as any);
        if (res.success) {
          message.success("仓库更新成功");
          onSuccess();
          onClose();
        } else {
          message.error(Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "更新失败"));
        }
      } else {
        const res = await createRepository({
          applicationId: appId,
          providerType: values.providerType as any,
          repoName: values.repoName,
          repoUrl: values.repoUrl,
          sshUrl: values.sshUrl,
          defaultBranch: values.defaultBranch,
          authType: values.authType as any,
          credentialId: values.credentialId,
          webhookSecret: values.webhookSecret,
        });
        if (res.success) {
          message.success("仓库绑定成功");
          onSuccess();
          onClose();
        } else {
          message.error(Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "绑定失败"));
        }
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer
      title={isEdit ? "编辑仓库" : "绑定仓库"}
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
      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={handleSubmit}
      >
        <Form.Item label="仓库名称" name="repoName" rules={[{ required: true, message: "请输入仓库名称" }]}>
          <Input placeholder="如 user-service" />
        </Form.Item>

        <Form.Item label="代码托管平台" name="providerType" rules={[{ required: true, message: "请选择平台" }]}>
          <Select placeholder="选择平台" options={repositoryProviderOptions} />
        </Form.Item>

        <Form.Item label="仓库地址（HTTPS）" name="repoUrl" rules={[{ required: true, message: "请输入仓库地址" }]}>
          <Input placeholder="https://github.com/org/repo.git" />
        </Form.Item>

        <Form.Item label="SSH 地址" name="sshUrl">
          <Input placeholder="git@github.com:org/repo.git（选填）" />
        </Form.Item>

        <Form.Item label="默认分支" name="defaultBranch" rules={[{ required: true, message: "请输入默认分支" }]}>
          <Input placeholder="main" />
        </Form.Item>

        <Form.Item label="认证方式" name="authType" rules={[{ required: true, message: "请选择认证方式" }]}>
          <Select placeholder="选择认证方式" options={repositoryAuthTypeOptions} />
        </Form.Item>

        <Form.Item label="关联凭据" name="credentialId">
          <Select
            placeholder="选择凭据（可选）"
            allowClear
            options={credentials.map((c) => ({
              value: c.id ?? c._id ?? "",
              label: `${c.name} (${c.type})`,
            }))}
          />
        </Form.Item>

        <Form.Item label="Webhook Secret" name="webhookSecret">
          <Input.Password placeholder="用于验证 Webhook 签名（选填）" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
