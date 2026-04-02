import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import { Button, Checkbox, Form, Input, Segmented, message } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { login, sendEmailCode, type LoginParams } from "../../service/api";
import { setAccessToken } from "../../service/request";
import { resolveLoginRedirectTarget } from "../../utils";
import styles from "./styles.module.less";

type LoginMode = "email" | "phone" | "password";

type ModeOption = {
  key: LoginMode;
  title: string;
  description: string;
};

const modeOptions: ModeOption[] = [
  { key: "email", title: "邮箱验证码", description: "使用邮箱获取一次性验证码" },
  { key: "phone", title: "手机号登录", description: "使用手机号验证码快速登录" },
  { key: "password", title: "密码登录", description: "使用账号密码安全登录" },
];

const phonePattern = /^\+?\d{6,20}$/;
const emailCodeCooldownSeconds = 60;

function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, "");
}

type LoginFormValues = {
  email?: string;
  emailCode?: string;
  phone?: string;
  phoneCode?: string;
  account?: string;
  password?: string;
};

type LoginLocationState = {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  };
};

export default function Login() {
  const [form] = Form.useForm<LoginFormValues>();
  const navigate = useNavigate();
  const location = useLocation();
  const [messageApi, contextHolder] = message.useMessage();
  const [mode, setMode] = useState<LoginMode>("email");
  const [agreed, setAgreed] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingEmailCode, setSendingEmailCode] = useState(false);
  const [emailCodeCooldown, setEmailCodeCooldown] = useState(0);
  const visualRef = useRef<HTMLDivElement | null>(null);

  const activeMeta = useMemo(
    () => modeOptions.find((item) => item.key === mode) ?? modeOptions[0],
    [mode],
  );
  const redirectTarget = useMemo(
    () =>
      resolveLoginRedirectTarget(
        location.search,
        (location.state as LoginLocationState | null)?.from,
      ) ?? "/dashboard",
    [location.search, location.state],
  );

  const updateTilt = (event: MouseEvent<HTMLDivElement>) => {
    const target = visualRef.current;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const percentX = offsetX / rect.width - 0.5;
    const percentY = offsetY / rect.height - 0.5;
    const tiltX = (-percentY * 12).toFixed(2);
    const tiltY = (percentX * 12).toFixed(2);

    target.style.setProperty("--tilt-x", `${tiltX}deg`);
    target.style.setProperty("--tilt-y", `${tiltY}deg`);
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

  const handleModeChange = (value: LoginMode) => {
    setMode(value);
  };

  useEffect(() => {
    if (emailCodeCooldown <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setEmailCodeCooldown((prev) => prev - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [emailCodeCooldown]);

  const handleSendEmailCode = async () => {
    try {
      const values = await form.validateFields(["email"]);
      const email = values.email?.trim();

      if (!email) {
        return;
      }

      setSendingEmailCode(true);
      const response = await sendEmailCode({ email });

      if (!response.success) {
        return;
      }

      setEmailCodeCooldown(emailCodeCooldownSeconds);
      messageApi.success("验证码已发送，请注意查收");
    } catch (error) {
      if (error && typeof error === "object" && "errorFields" in error) {
        return;
      }

      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "验证码发送失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSendingEmailCode(false);
    }
  };

  const handleSubmit = async (values: LoginFormValues) => {
    const email = values.email?.trim() ?? "";
    const emailCode = values.emailCode?.trim() ?? "";
    const phone = values.phone?.trim() ?? "";
    const phoneCode = values.phoneCode?.trim() ?? "";
    const account = values.account?.trim() ?? "";
    const password = values.password?.trim() ?? "";

    if (!agreed) {
      messageApi.warning("请先阅读并同意服务协议与隐私政策");
      return;
    }

    let params: LoginParams | null = null;

    if (mode === "email") {
      params = {
        type: "email",
        email,
        authCode: emailCode,
      };
    }

    if (mode === "phone") {
      params = {
        type: "phone",
        phone: normalizePhone(phone),
        authCode: phoneCode,
      };
    }

    if (mode === "password") {
      if (!account || !password) {
        messageApi.error("请输入账号和密码");
        return;
      }

      params = {
        type: "password",
        username: account,
        password,
      };
    }

    if (!params) {
      messageApi.error("暂不支持当前登录方式");
      return;
    }

    setSubmitting(true);

    try {
      const response = await login(params);

      if (!response.success) {
        return;
      }

      if (!response.data?.token) {
        messageApi.error("登录成功但未获取到 token");
        return;
      }

      setAccessToken(response.data.token);
      await messageApi.success("登录成功", 1.2);
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      if (error && typeof error === "object" && "handled" in error && error.handled) {
        return;
      }

      const errorMessage =
        error instanceof Error ? error.message : "登录请求失败，请稍后重试";
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      {contextHolder}
      <div className={styles.pageGlow} aria-hidden="true" />
      <div className={styles.pageGrid} aria-hidden="true" />

      <div className={styles.loginShell}>
        <section
          className={styles.visualPanel}
          ref={visualRef}
          onMouseMove={updateTilt}
          onMouseLeave={resetTilt}
        >
          <div className={styles.visualHeader}>
            <div className={styles.brand}>AOKO DevOps</div>
            <p className={styles.brandSubtitle}>统一登录中心</p>
          </div>

          <div className={styles.orbitArea}>
            <div className={styles.orbitCore} />
            <div className={styles.orbitRing} />
            <div className={styles.orbitRingSecondary} />

            <div className={styles.floatingCard}>
              <div className={styles.cardTitle}>智能校验</div>
              <div className={styles.cardDesc}>动态风控保护每次登录</div>
            </div>
            <div className={styles.floatingCardAlt}>
              <div className={styles.cardTitle}>多因子策略</div>
              <div className={styles.cardDesc}>灵活组合验证码与密码</div>
            </div>
            <div className={styles.floatingBadge}>Live</div>
          </div>

          <div className={styles.visualFooter}>
            <div className={styles.footerLabel}>体验更安全、更轻盈的登录流程</div>
            <div className={styles.footerMeta}>AOKO Security • v2.6</div>
          </div>
        </section>

        <section className={styles.formPanel}>
          <div className={styles.formHeader}>
            <div>
              <div className={styles.formTitle}>欢迎回来</div>
              <div className={styles.formSubtitle}>选择最适合你的登录方式</div>
            </div>
            <div className={styles.modeSummary}>
              <span className={styles.modeLabel}>{activeMeta.title}</span>
              <span className={styles.modeDesc}>{activeMeta.description}</span>
            </div>
          </div>

          <div className={styles.modeTabs} role="tablist">
            <Segmented<LoginMode>
              block
              value={mode}
              className={styles.modeTabsSegmented}
              options={modeOptions.map((item) => ({
                label: item.title,
                value: item.key,
              }))}
              onChange={handleModeChange}
            />
          </div>

          <Form<LoginFormValues>
            form={form}
            className={styles.loginForm}
            requiredMark={false}
            onFinish={handleSubmit}
          >
            {mode === "email" && (
              <>
                <label className={styles.fieldLabel} htmlFor="email">
                  邮箱
                </label>
                <Form.Item
                  className={styles.formItem}
                  name="email"
                  rules={[
                    { required: true, message: "请输入邮箱" },
                    { type: "email", message: "请输入正确的邮箱地址" },
                  ]}
                >
                  <Input
                    id="email"
                    className={styles.textInput}
                    variant="borderless"
                    placeholder="name@example.com"
                    autoComplete="email"
                  />
                </Form.Item>
                <label className={styles.fieldLabel} htmlFor="emailCode">
                  验证码
                </label>
                <div className={styles.inlineField}>
                  <Form.Item
                    className={styles.inlineFormItem}
                    name="emailCode"
                    rules={[{ required: true, message: "请输入邮箱验证码" }]}
                  >
                    <Input
                      id="emailCode"
                      className={styles.textInput}
                      variant="borderless"
                      placeholder="输入验证码"
                      autoComplete="one-time-code"
                    />
                  </Form.Item>
                  <Button
                    className={styles.ghostButton}
                    type="default"
                    htmlType="button"
                    loading={sendingEmailCode}
                    disabled={emailCodeCooldown > 0}
                    onClick={handleSendEmailCode}
                  >
                    {emailCodeCooldown > 0 ? `${emailCodeCooldown}s后重发` : "获取验证码"}
                  </Button>
                </div>
              </>
            )}

            {mode === "phone" && (
              <>
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
                        if (!value) {
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
                <label className={styles.fieldLabel} htmlFor="phoneCode">
                  验证码
                </label>
                <div className={styles.inlineField}>
                  <Form.Item
                    className={styles.inlineFormItem}
                    name="phoneCode"
                    rules={[{ required: true, message: "请输入手机验证码" }]}
                  >
                    <Input
                      id="phoneCode"
                      className={styles.textInput}
                      variant="borderless"
                      placeholder="输入验证码"
                      autoComplete="one-time-code"
                    />
                  </Form.Item>
                  <Button className={styles.ghostButton} type="default" htmlType="button">
                    发送验证码
                  </Button>
                </div>
              </>
            )}

            {mode === "password" && (
              <>
                <label className={styles.fieldLabel} htmlFor="account">
                  账号
                </label>
                <Form.Item
                  className={styles.formItem}
                  name="account"
                  rules={[{ required: true, message: "请输入用户名 / 邮箱 / 手机号" }]}
                >
                  <Input
                    id="account"
                    className={styles.textInput}
                    variant="borderless"
                    placeholder="用户名 / 邮箱 / 手机号"
                    autoComplete="username"
                  />
                </Form.Item>
                <label className={styles.fieldLabel} htmlFor="password">
                  密码
                </label>
                <Form.Item
                  className={styles.formItem}
                  name="password"
                  rules={[{ required: true, message: "请输入密码" }]}
                >
                  <Input.Password
                    id="password"
                    className={styles.textInput}
                    variant="borderless"
                    placeholder="输入密码"
                    autoComplete="current-password"
                  />
                </Form.Item>
              </>
            )}

            <Button
              className={styles.primaryButton}
              type="primary"
              htmlType="submit"
              loading={submitting}
            >
              立即登录
            </Button>

            <div className={styles.registerHint}>
              还没有账号？
              <Link className={styles.registerLink} to="/register">
                立即注册
              </Link>
            </div>

            <div className={styles.formFooter}>
              <Checkbox
                checked={agreed}
                className={styles.checkbox}
                onChange={(event) => setAgreed(event.target.checked)}
              >
                我已阅读并同意服务协议与隐私政策
              </Checkbox>
              <Button className={styles.linkButton} type="link" htmlType="button">
                忘记密码？
              </Button>
            </div>
          </Form>

          <div className={styles.thirdSection}>
            <div className={styles.thirdTitle}>三方登录</div>
            <div className={styles.thirdList}>
              <Button
                className={styles.thirdItem}
                type="default"
                htmlType="button"
                data-label="微信"
                aria-label="微信登录"
              >
                <svg viewBox="0 0 48 48" className={styles.thirdIcon} aria-hidden="true">
                  <path d="M20.5 14c-6 0-10.5 3.8-10.5 8.6 0 2.8 1.6 5.3 4.2 6.8l-1 3.6 3.8-2.1c1.1.3 2.3.5 3.5.5 6 0 10.5-3.8 10.5-8.6S26.5 14 20.5 14z" />
                  <path d="M30.3 22.2c-4.6 0-8.2 2.9-8.2 6.5 0 3.6 3.6 6.5 8.2 6.5 1 0 2-.1 2.9-.4l3.4 2-.9-3.1c2-1.2 3.2-3.1 3.2-5 0-3.6-3.6-6.5-8.6-6.5z" />
                </svg>
              </Button>
              <Button
                className={styles.thirdItem}
                type="default"
                htmlType="button"
                data-label="Telegram"
                aria-label="Telegram 登录"
              >
                <svg viewBox="0 0 48 48" className={styles.thirdIcon} aria-hidden="true">
                  <path d="M40 10 9 23.7c-1.2.5-1.1 2.2.2 2.6l7.5 2.2 2.8 8.8c.4 1.2 1.9 1.5 2.7.6l4.6-5.1 7.8 5.8c.9.7 2.2.2 2.4-.9L41 12c.2-1.2-.9-2.1-1-2z" />
                  <path d="M17.4 28.5 35 15.7" />
                </svg>
              </Button>
              <Button
                className={styles.thirdItem}
                type="default"
                htmlType="button"
                data-label="GitHub"
                aria-label="GitHub 登录"
              >
                <svg viewBox="0 0 48 48" className={styles.thirdIcon} aria-hidden="true">
                  <path d="M24 7c-9.4 0-17 7.5-17 16.8 0 7.4 4.9 13.8 11.7 16 1 .2 1.3-.4 1.3-.9v-3.1c-4.8 1-5.8-2-5.8-2-1-2.5-2.5-3.1-2.5-3.1-2-1.3.2-1.3.2-1.3 2.2.1 3.4 2.3 3.4 2.3 2 3.3 5.3 2.3 6.6 1.7.2-1.4.8-2.3 1.4-2.8-3.8-.4-7.8-1.9-7.8-8.3 0-1.8.7-3.3 1.8-4.5-.2-.4-.8-2 .2-4.2 0 0 1.5-.5 4.9 1.8 1.4-.4 2.9-.6 4.4-.6s3 .2 4.4.6c3.4-2.3 4.9-1.8 4.9-1.8 1 2.2.4 3.8.2 4.2 1.1 1.2 1.8 2.7 1.8 4.5 0 6.4-4 7.9-7.9 8.3.8.7 1.5 2 1.5 4.1v6c0 .5.3 1.1 1.3.9 6.8-2.2 11.7-8.6 11.7-16C41 14.5 33.4 7 24 7z" />
                </svg>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
