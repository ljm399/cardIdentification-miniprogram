const cloud = require("wx-server-sdk");
const tencentcloud = require("tencentcloud-sdk-nodejs");

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

// 导入对应产品模块的client models
const OcrClient = tencentcloud.ocr.v20181119.Client;

// 云函数入口函数
exports.main = async (event, context) => {
  const { imageUrl, imageBase64 } = event;

  try {
    // 实例化要请求产品的client对象
    const client = new OcrClient({
      // 腾讯云认证信息 - 从环境变量读取
      credential: {
        secretId: process.env.TENCENT_SECRET_ID,
        secretKey: process.env.TENCENT_SECRET_KEY,
      },
      // 产品地域
      region: "ap-shanghai",
      // 可选配置实例
      profile: {
        signMethod: "TC3-HMAC-SHA256", // 签名方法
        httpProfile: {
          reqMethod: "POST", // 请求方法
          reqTimeout: 30, // 请求超时时间，默认60s
        },
      },
    });

    // 构建请求参数
    const params = {};
    if (imageUrl) {
      params.ImageUrl = imageUrl;
    } else if (imageBase64) {
      params.ImageBase64 = imageBase64;
    }

    // 调用身份证识别接口
    const data = await client.IDCardOCR(params);

    return {
      success: true,
      data: data,
    };
  } catch (err) {
    console.error("身份证识别错误:", err);
    return {
      success: false,
      error: err.message || "识别失败",
    };
  }
};
