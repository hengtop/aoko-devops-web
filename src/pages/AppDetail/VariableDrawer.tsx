import { useEffect, useState } from "react";
import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  Select,
  Space,
  Switch,
} from "antd";
import {
  VARIABLE_SCOPE_TYPES,
  variableScopeTypeOptions,
} from "@constants";
import {
  createVariable,
  updateVariable,
  type VariableRecord,
  type EnvironmentRecord,
  type PipelineRecord,
} from "@service/api";
import type { VariableScopeType } from "@service/api";

interface VariableDrawerProps {
  open: boolean;
  appId: string;
  editRecord?: VariableRecord | null;
  environments: EnvironmentRecord[];
  pipelines: PipelineRecord[];
  onClose: () => void;
  onSuccess: () => void;
}

type FormValues = {
  key: string;
  value: string;
  scopeType: VariableScopeType;
  environmentId?: string;
  pipelineId?: string;
  isSecret?: boolean;
  description?: string;
};

export default function VariableDrawer({
  open,
  appId,
  editRecord,
  environments,
  pipelines,
  onClose,
  onSuccess,
}: VariableDrawerProps) {
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [scopeType, setScopeType] = useState<VariableScopeType>(VARIABLE_SCOPE_TYPES.APPLICATION);
  const [isSecret, setIsSecret] = useState(false);

  const isEdit = !!editRecord;

  useEffect(() => {
    if (open) {
      if (editRecord) {
        form.setFieldsValue({
          key: editRecord.key,
          value: "",
          scopeType: editRecord.scopeType,
          environmentId: editRecord.environmentId,
          pipelineId: editRecord.pipelineId,
          isSecret: editRecord.isSecret ?? false,
          description: editRecord.description,
        });
        setScopeType(editRecord.scopeType);
        setIsSecret(editRecord.isSecret ?? false);
      } else {
        form.resetFields();
        form.setFieldValue("scopeType", VARIABLE_SCOPE_TYPES.APPLICATION);
        setScopeType(VARIABLE_SCOPE_TYPES.APPLICATION);
        setIsSecret(false);
      }
    }
  }, [open, editRecord]);

  async function handleSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      if (isEdit) {
        const id = editRecord!.id ?? editRecord!._id ?? "";
        const payload: Record<string, unknown> = {
          id,
          key: values.key,
          scopeType: values.scopeType,
          isSecret: values.isSecret,
          description: values.description,
          environmentId: values.scopeType === VARIABLE_SCOPE_TYPES.ENVIRONMENT ? values.environmentId : undefined,
          pipelineId: values.scopeType === VARIABLE_SCOPE_TYPES.PIPELINE ? values.pipelineId : undefined,
        };
        if (values.value) payload.value = values.value;

        const res = await updateVariable(payload as any);
        if (res.success) {
          message.success("变量更新成功");
          onSuccess();
          onClose();
        } else {
          message.error(Array.isArray(res.msg) ? res.msg.join("，") : (res.msg ?? "更新失败"));
        }
      } else {
        const res = await createVariable({
          applicationId: appId,
          key: values.key,
          value: values.value,
          scopeType: values.scopeType,
          environmentId: values.scopeType === VARIABLE_SCOPE_TYPES.ENVIRONMENT ? values.environmentId : undefined,
          pipelineId: values.scopeType === VARIABLE_SCOPE_TYPES.PIPELINE ? values.pipelineId : undefined,
          isSecret: values.isSecret,
          description: values.description,
        });
        if (res.success) {
          message.success("变量创建成功");
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
      title={isEdit ? "编辑变量" : "新增变量"}
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
        <Form.Item
          label="变量名（Key）"
          name="key"
          rules={[
            { required: true, message: "请输入变量名" },
            {
              pattern: /^[A-Z_][A-Z0-9_]*$/,
              message: "变量名仅支持大写字母、数字和下划线，且不能以数字开头",
            },
          ]}
          extra="建议使用大写字母和下划线，如 DATABASE_URL"
        >
          <Input placeholder="DATABASE_URL" />
        </Form.Item>

        <Form.Item label="是否加密" name="isSecret" valuePropName="checked">
          <Switch
            checkedChildren="加密"
            unCheckedChildren="明文"
            onChange={(v) => setIsSecret(v)}
          />
        </Form.Item>

        <Form.Item
          label="变量值（Value）"
          name="value"
          rules={isEdit ? [] : [{ required: true, message: "请输入变量值" }]}
          extra={isEdit ? "如需更新变量值请重新填写，留空则保持不变" : undefined}
        >
          {isSecret ? (
            <Input.Password placeholder={isEdit ? "留空则保持不变" : "请输入变量值"} />
          ) : (
            <Input.TextArea rows={2} placeholder={isEdit ? "留空则保持不变" : "请输入变量值"} />
          )}
        </Form.Item>

        <Form.Item
          label="作用域"
          name="scopeType"
          rules={[{ required: true, message: "请选择作用域" }]}
        >
          <Select
            options={variableScopeTypeOptions}
            onChange={(v: VariableScopeType) => {
              setScopeType(v);
              form.resetFields(["environmentId", "pipelineId"]);
            }}
          />
        </Form.Item>

        {scopeType === VARIABLE_SCOPE_TYPES.ENVIRONMENT && (
          <Form.Item
            label="关联环境"
            name="environmentId"
            rules={[{ required: true, message: "请选择关联环境" }]}
          >
            <Select
              placeholder="选择环境"
              options={environments.map((e) => ({
                value: e.id ?? e._id ?? "",
                label: `${e.name} (${e.code})`,
              }))}
            />
          </Form.Item>
        )}

        {scopeType === VARIABLE_SCOPE_TYPES.PIPELINE && (
          <Form.Item
            label="关联流水线"
            name="pipelineId"
            rules={[{ required: true, message: "请选择关联流水线" }]}
          >
            <Select
              placeholder="选择流水线"
              options={pipelines.map((p) => ({
                value: p.id ?? p._id ?? "",
                label: `${p.name} (${p.code})`,
              }))}
            />
          </Form.Item>
        )}

        <Form.Item label="描述" name="description">
          <Input placeholder="变量用途说明（选填）" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
