import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  message,
  Row,
  Spin,
  Tag,
  Tabs,
  Typography,
} from "antd";
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import { APP_ROUTE_PATHS, buildAppDetailPath, buildProductEditPath } from "@constants";
import {
  getProductDetail,
  listApplications,
  type ApplicationRecord,
  type ProductRecord,
} from "@service/api";
import styles from "./styles.module.less";

const { Title, Text } = Typography;

function getAppId(app: ApplicationRecord) {
  return app.id ?? app._id ?? "";
}

export default function ProductDetail() {
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductRecord | null>(null);
  const [apps, setApps] = useState<ApplicationRecord[]>([]);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);

  async function loadApps() {
    setLoadingApps(true);
    const res = await listApplications({ productId: id, pageNum: 1, pageSize: 100 });
    if (res.success) {
      setApps(res.data?.list ?? []);
    }
    setLoadingApps(false);
  }

  useEffect(() => {
    async function load() {
      setLoadingProduct(true);
      const res = await getProductDetail({ id });
      if (res.success && res.data) {
        setProduct(res.data);
        await loadApps();
      } else {
        message.error("获取产品详情失败");
      }
      setLoadingProduct(false);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loadingProduct) {
    return (
      <div className={styles.layout}>
        <div className={styles.body}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>菜单</div>
            <AppConsoleMenu />
          </aside>
          <main className={styles.main}>
            <Spin />
          </main>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const tabItems = [
    {
      key: "apps",
      label: `应用 (${apps.length})`,
      children: (
        <div className={styles.appsTab}>
          <div className={styles.tabToolbar}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() =>
                navigate(`${APP_ROUTE_PATHS.APP_CREATE}?productId=${id}`)
              }
            >
              创建应用
            </Button>
          </div>
          <Spin spinning={loadingApps}>
            {apps.length === 0 ? (
              <Empty description="暂无应用" style={{ marginTop: 48 }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    navigate(`${APP_ROUTE_PATHS.APP_CREATE}?productId=${id}`)
                  }
                >
                  创建第一个应用
                </Button>
              </Empty>
            ) : (
              <Row gutter={[16, 16]}>
                {apps.map((app) => (
                  <Col key={getAppId(app)} xs={24} sm={12} md={8}>
                    <Card
                      className={styles.appCard}
                      hoverable
                      onClick={() => navigate(buildAppDetailPath(getAppId(app)))}
                    >
                      <div className={styles.appCardHeader}>
                        <Avatar
                          shape="square"
                          size={40}
                          style={{
                            background: "var(--ant-color-primary-bg)",
                            color: "var(--ant-color-primary)",
                          }}
                          icon={<AppstoreOutlined />}
                        />
                        <div className={styles.appCardInfo}>
                          <div className={styles.appName}>{app.name}</div>
                          <Tag color="default" style={{ fontSize: 11 }}>
                            {app.code}
                          </Tag>
                        </div>
                      </div>
                      {app.description && (
                        <Text
                          type="secondary"
                          style={{ fontSize: 12, marginTop: 8, display: "block" }}
                        >
                          {app.description}
                        </Text>
                      )}
                      <div className={styles.appRepoUrl}>
                        <Text
                          type="secondary"
                          ellipsis
                          style={{ fontSize: 11 }}
                        >
                          {app.repo_url}
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Spin>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.layout}>
      <div className={styles.body}>
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>菜单</div>
          <AppConsoleMenu />
        </aside>
        <main className={styles.main}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(APP_ROUTE_PATHS.PRODUCT)}
            style={{ marginBottom: 16 }}
          >
            返回产品列表
          </Button>

        <Card className={styles.productHeader}>
          <div className={styles.productHeaderContent}>
            <div className={styles.productAvatar}>
              {product.avatar ? (
                <img src={product.avatar} alt={product.name} />
              ) : (
                <AppstoreOutlined />
              )}
            </div>
            <div className={styles.productInfo}>
              <Title level={4} style={{ margin: 0 }}>
                {product.name}
              </Title>
              <Tag color="blue" style={{ marginTop: 4 }}>
                {product.code}
              </Tag>
              {product.description && (
                <Text type="secondary" style={{ display: "block", marginTop: 6 }}>
                  {product.description}
                </Text>
              )}
            </div>
            <div className={styles.productActions}>
              <Button icon={<EditOutlined />} onClick={() => navigate(buildProductEditPath(id))}>编辑</Button>
            </div>
          </div>
        </Card>

        <div style={{ marginTop: 20 }}>
          <Tabs items={tabItems} />
        </div>
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
