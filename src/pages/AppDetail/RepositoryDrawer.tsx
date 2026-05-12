import { useEffect, useState } from "react";
import { Button, Drawer, Form, Input, message, Select, Space, Switch } from "antd";
import {
  REPOSITORY_AUTH_TYPES,
  REPOSITORY_PROVIDERS,
  REPOSITORY_ROLES,
  repositoryProviderOptions,
  repositoryAuthTypeOptions,
  repositoryRoleOptions,
} from "@constants";
import {
  createRepository,
  updateRepository,
  listCredentials,
  type RepositoryRecord,
  type CredentialRecord,
  type RepositoryAuthType,
  type RepositoryProvider,
  type RepositoryRole,
} from "@service/api";

type RepositoryDrawerProps = {
  open: boolean;
  appId: string;
  editRecord?: RepositoryRecord | null;
  onClose: () => void;
  onSuccess: () => void;
};

type FormValues = {
  repoName: string;
  providerType: RepositoryProvider;
  repoUrl: string;
  sshUrl?: string;
  defaultBranch: string;
  authType: RepositoryAuthType;
  credentialId?: string;
  isDefault?: boolean;
  repositoryRole: RepositoryRole;
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
      let cancelled = false;

      async function loadCredentials() {
        const res = await listCredentials({ applicationId: appId, pageNum: 1, pageSize: 100 });
        if (res.success && !cancelled) {
          setCredentials(res.data?.list ?? []);
        }
      }

      if (editRecord) {
        form.setFieldsValue({
          repoName: editRecord.repoName,
          providerType: editRecord.providerType,
          repoUrl: editRecord.repoUrl,
          sshUrl: editRecord.sshUrl,
          defaultBranch: editRecord.defaultBranch,
          authType: editRecord.authType,
          credentialId: editRecord.credentialId,
          isDefault: editRecord.isDefault ?? false,
          repositoryRole: editRecord.repositoryRole ?? REPOSITORY_ROLES.SOURCE,
          webhookSecret: editRecord.webhookSecret,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          providerType: REPOSITORY_PROVIDERS.SELF_HOSTED,
          defaultBranch: "main",
          authType: REPOSITORY_AUTH_TYPES.TOKEN,
          isDefault: false,
          repositoryRole: REPOSITORY_ROLES.SOURCE,
        });
      }
      void loadCredentials();

      return () => {
        cancelled = true;
      };
    }
  }, [appId, editRecord, form, open]);

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const payload = {
        applicationId: appId,
        providerType: values.providerType,
        repoName: values.repoName,
        repoUrl: values.repoUrl,
        sshUrl: values.sshUrl,
        defaultBranch: values.defaultBranch,
        authType: values.authType,
        credentialId: values.credentialId,
        isDefault: values.isDefault ?? false,
        repositoryRole: values.repositoryRole,
        webhookSecret: values.webhookSecret,
      };

      if (isEdit) {
        const id = editRecord!.id ?? editRecord!._id ?? "";
        const res = await updateRepository({ id, ...payload });
        if (res.success) {
          message.success("仓库更新成功");
          onSuccess();
          onClose();
        } else {
          message.error(Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "更新失败"));
        }
      } else {
        const res = await createRepository(payload);
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

        <Form.Item
          label="仓库用途"
          name="repositoryRole"
          rules={[{ required: true, message: "请选择仓库用途" }]}
        >
          <Select placeholder="选择仓库用途" options={repositoryRoleOptions} />
        </Form.Item>

        <Form.Item
          label="设为该用途默认仓库"
          name="isDefault"
          valuePropName="checked"
          extra="开启后，同一应用相同用途下的其他默认仓库会自动取消默认。"
        >
          <Switch checkedChildren="默认" unCheckedChildren="普通" />
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
