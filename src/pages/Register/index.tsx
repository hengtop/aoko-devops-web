import { useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import { APP_ROUTE_PATHS } from "@constants";
import { register } from "@service/api";
import styles from "./styles.module.less";

type RegisterFormValues = {
  phone?: string;
  username?: string;
  email?: string;
  password?: string;
  authCode?: string;
  inviationCode?: string;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?\d{6,20}$/;

function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, "");
}

function isBlank(value?: string) {
  return !value?.trim();
}

export default function Register() {
  const [form] = Form.useForm<RegisterFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);
  const visualRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const quickNotes = useMemo(
    () => [
      { title: "手机号注册", description: "当前注册仅支持手机号作为主账号入口" },
      { title: "唯一用户名", description: "用户名将作为系统内的唯一身份标识" },
      { title: "邀请码校验", description: "邀请码与短信验证码均为必填校验项" },
    ],
    [],
  );

  const updateTilt = (event: MouseEvent<HTMLDivElement>) => {
    const target = visualRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const percentX = offsetX / rect.width - 0.5;
    const percentY = offsetY / rect.height - 0.5;

    target.style.setProperty("--tilt-x", `${(-percentY * 10).toFixed(2)}deg`);
    target.style.setProperty("--tilt-y", `${(percentX * 10).toFixed(2)}deg`);
    target.style.setProperty("--glow-x", `${(percentX * 100 + 50).toFixed(2)}%`);
    target.style.setProperty("--glow-y", `${(percentY * 100 + 50).toFixed(2)}%`);
  };

  const resetTilt = () => {
    const target = visualRef.current;
    if (!target) return;
    target.style.setProperty("--tilt-x", "0deg");
    target.style.setProperty("--tilt-y", "0deg");
    target.style.setProperty("--glow-x", "50%");
    target.style.setProperty("--glow-y", "50%");
  };

  const handleSubmit = async (values: RegisterFormValues) => {
    const payload = {
      phone: normalizePhone(values.phone?.trim() ?? ""),
      username: values.username?.trim() ?? "",
      email: values.email?.trim() || undefined,
      password: values.password?.trim() ?? "",
      authCode: values.authCode?.trim() ?? "",
      inviationCode: values.inviationCode?.trim() ?? "",
    };

    setSubmitting(true);

    try {
      const response = await register(payload);

      if (!response.success) {
        return;
      }

      await messageApi.success("注册成功，请登录", 1.2);
      navigate(APP_ROUTE_PATHS.LOGIN);
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "注册请求失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.registerPage}>
      {contextHolder}
      <div className={styles.pageGlow} aria-hidden="true" />
      <div className={styles.pageGrid} aria-hidden="true" />

      <div className={styles.registerShell}>
        <section
          className={styles.visualPanel}
          ref={visualRef}
          onMouseMove={updateTilt}
          onMouseLeave={resetTilt}
        >
          <div className={styles.visualHeader}>
            <div className={styles.brand}>AOKO DevOps</div>
            <p className={styles.brandSubtitle}>统一注册中心</p>
          </div>

          <div className={styles.signalStage}>
            <div className={styles.signalCore} />
            <div className={styles.signalRing} />
            <div className={styles.signalGrid} />
            <div className={styles.signalCard}>
              <div className={styles.cardTitle}>Access Bootstrap</div>
              <div className={styles.cardDesc}>新账号接入前先完成身份校验与邀请码认证</div>
            </div>
          </div>

          <div className={styles.noteList}>
            {quickNotes.map((item) => (
              <div key={item.title} className={styles.noteItem}>
                <div className={styles.noteTitle}>{item.title}</div>
                <div className={styles.noteDesc}>{item.description}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.formHeader}>
            <div>
              <div className={styles.formTitle}>创建账号</div>
              <div className={styles.formSubtitle}>请完整填写注册信息并完成必要校验</div>
            </div>
            <div className={styles.modeSummary}>
              <span className={styles.modeLabel}>Phone Signup</span>
              <span className={styles.modeDesc}>手机号是当前唯一注册方式</span>
            </div>
          </div>

          <Form<RegisterFormValues>
            form={form}
            className={styles.registerForm}
            requiredMark={false}
            onFinish={handleSubmit}
          >
            <label className={styles.fieldLabel} htmlFor="phone">
              手机号
            </label>
            <Form.Item
              className={styles.formItem}
              name="phone"
              rules={[
                { required: true, message: "请输入手机号" },
                {
                  validator: async (_, value) => {
                    if (isBlank(value)) {
                      return;
                    }

                    if (phonePattern.test(normalizePhone(String(value)))) {
                      return;
                    }

                    throw new Error("请输入正确的手机号");
                  },
                },
              ]}
            >
              <Input
                id="phone"
                className={styles.textInput}
                variant="borderless"
                placeholder="+86 138 8888 8888"
                autoComplete="tel"
              />
            </Form.Item>

            <label className={styles.fieldLabel} htmlFor="username">
              用户名称
            </label>
            <Form.Item
              className={styles.formItem}
              name="username"
              rules={[{ required: true, whitespace: true, message: "请输入用户名称" }]}
            >
              <Input
                id="username"
                className={styles.textInput}
                variant="borderless"
                placeholder="请输入唯一用户名"
                autoComplete="username"
              />
            </Form.Item>

            <label className={styles.fieldLabel} htmlFor="email">
              邮箱
            </label>
            <Form.Item
              className={styles.formItem}
              name="email"
              rules={[
                {
                  validator: async (_, value) => {
                    if (isBlank(value)) {
                      return;
                    }

                    if (emailPattern.test(String(value).trim())) {
                      return;
                    }

                    throw new Error("请输入正确的邮箱地址");
                  },
                },
              ]}
            >
              <Input
                id="email"
                className={styles.textInput}
                variant="borderless"
                placeholder="选填：name@example.com"
                autoComplete="email"
              />
            </Form.Item>

            <label className={styles.fieldLabel} htmlFor="password">
              密码
            </label>
            <Form.Item
              className={styles.formItem}
              name="password"
              rules={[{ required: true, whitespace: true, message: "请输入密码" }]}
            >
              <Input.Password
                id="password"
                className={styles.textInput}
                variant="borderless"
                placeholder="请输入密码"
                autoComplete="new-password"
              />
            </Form.Item>

            <label className={styles.fieldLabel} htmlFor="authCode">
              验证码
            </label>
            <Form.Item
              className={styles.formItem}
              name="authCode"
              rules={[{ required: true, whitespace: true, message: "请输入短信验证码" }]}
            >
              <Input
                id="authCode"
                className={styles.textInput}
                variant="borderless"
                placeholder="请输入短信验证码"
                autoComplete="one-time-code"
              />
            </Form.Item>

            <label className={styles.fieldLabel} htmlFor="inviationCode">
              邀请码
            </label>
            <Form.Item
              className={styles.formItem}
              name="inviationCode"
              rules={[{ required: true, whitespace: true, message: "请输入邀请码" }]}
            >
              <Input
                id="inviationCode"
                className={styles.textInput}
                variant="borderless"
                placeholder="请输入邀请码"
              />
            </Form.Item>

            <Button
              className={styles.primaryButton}
              type="primary"
              htmlType="submit"
              loading={submitting}
            >
              立即注册
            </Button>
          </Form>
        </section>
      </div>
    </div>
  );
}
