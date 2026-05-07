import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Col, Empty, Input, Row, Space, Spin, Tag, Typography, message } from "antd";
import { AppstoreOutlined, PlusOutlined, SearchOutlined, TeamOutlined } from "@ant-design/icons";
import AppConsoleMenu from "@components/AppConsoleMenu";
import AppFooter from "@components/AppFooter";
import { APP_ROUTE_PATHS, buildProductDetailPath } from "@constants";
import { listProducts, type ProductRecord } from "@service/api";
import styles from "./styles.module.less";

const { Title, Text } = Typography;

export default function Product() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  async function fetchProducts() {
    setLoading(true);
    const res = await listProducts({ pageNum: 1, pageSize: 100 });
    if (res.success) {
      setProducts(res.data?.list ?? []);
    } else {
      message.error("获取产品列表失败");
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, []);

  const filtered = products.filter(
    (p) =>
      !searchText ||
      p.name.toLowerCase().includes(searchText.toLowerCase()) ||
      p.code.toLowerCase().includes(searchText.toLowerCase()),
  );

  function getProductId(record: ProductRecord) {
    return record.id ?? record._id ?? "";
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
          <div>
            <Title level={4} style={{ margin: 0 }}>
              产品管理
            </Title>
            <Text type="secondary">管理所有产品线及其应用</Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(APP_ROUTE_PATHS.PRODUCT_CREATE)}
          >
            新建产品
          </Button>
        </div>

        <div className={styles.toolbar}>
          <Input
            placeholder="搜索产品名称或 Code"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 280 }}
            allowClear
          />
        </div>

        <Spin spinning={loading}>
          {filtered.length === 0 && !loading ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无产品"
              style={{ marginTop: 80 }}
            >
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate(APP_ROUTE_PATHS.PRODUCT_CREATE)}
              >
                创建第一个产品
              </Button>
            </Empty>
          ) : (
            <Row gutter={[16, 16]}>
              {filtered.map((product) => (
                <Col key={getProductId(product)} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    className={styles.productCard}
                    hoverable
                    onClick={() => navigate(buildProductDetailPath(getProductId(product)))}
                  >
                    <div className={styles.cardAvatar}>
                      {product.avatar ? (
                        <img src={product.avatar} alt={product.name} />
                      ) : (
                        <AppstoreOutlined />
                      )}
                    </div>
                    <div className={styles.cardInfo}>
                      <div className={styles.cardName}>{product.name}</div>
                      <Tag color="blue" style={{ marginTop: 4 }}>
                        {product.code}
                      </Tag>
                      {product.description && (
                        <Text type="secondary" className={styles.cardDesc}>
                          {product.description}
                        </Text>
                      )}
                    </div>
                    <div className={styles.cardFooter}>
                      <Space size={4}>
                        <TeamOutlined />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          查看应用
                        </Text>
                      </Space>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Spin>
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
