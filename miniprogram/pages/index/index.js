Page({
  data: {
    cardType: 'idCard', // 当前选择的卡片类型：idCard 或 bankCard
    imagePath: '', // 选择的图片路径
    result: null, // 识别结果
    error: '', // 错误信息
    loading: false // 加载状态
  },

  onLoad() {
    // 初始化云开发环境
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        traceUser: true
      })
    }
  },

  // 选择卡片类型
  selectCardType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      cardType: type,
      imagePath: '',
      result: null,
      error: ''
    })
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        this.setData({
          imagePath: res.tempFiles[0].tempFilePath,
          result: null,
          error: ''
        })
      },
      fail: (err) => {
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        })
        console.error('选择图片失败：', err)
      }
    })
  },

  // 识别卡片
  async recognizeCard() {
    if (!this.data.imagePath) {
      wx.showToast({
        title: '请先选择图片',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true, error: '' })

    try {
      // 上传图片到云存储
      const cloudPath = `card-images/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`
      const uploadResult = await wx.cloud.uploadFile({
        cloudPath,
        filePath: this.data.imagePath
      })

      // 获取临时链接
      const tempFileURL = await wx.cloud.getTempFileURL({
        fileList: [uploadResult.fileID]
      })

      const imageUrl = tempFileURL.fileList[0].tempFileURL

      // 调用对应的云函数
      const functionName = this.data.cardType === 'idCard' ? 'idCardOCR' : 'bankCardOCR'
      
      const result = await wx.cloud.callFunction({
        name: functionName,
        data: {
          imageUrl: imageUrl
        }
      })

      console.log('识别结果：', result)

      if (result.result.success) {
        // 处理识别结果
        const ocrData = result.result.data
        
        if (this.data.cardType === 'idCard') {
          // 身份证识别结果
          this.setData({
            result: {
              Name: ocrData.Name,
              Sex: ocrData.Sex,
              Nation: ocrData.Nation,
              Birth: ocrData.Birth,
              Address: ocrData.Address,
              IdNum: ocrData.IdNum,
              Authority: ocrData.Authority,
              ValidDate: ocrData.ValidDate
            },
            loading: false
          })
        } else {
          // 银行卡识别结果
          this.setData({
            result: {
              CardNo: ocrData.CardNo,
              BankInfo: ocrData.BankInfo,
              ValidDate: ocrData.ValidDate
            },
            loading: false
          })
        }

        wx.showToast({
          title: '识别成功',
          icon: 'success'
        })
      } else {
        throw new Error(result.result.error || '识别失败')
      }
    } catch (err) {
      console.error('识别失败：', err)
      this.setData({
        loading: false,
        error: err.message || '识别失败，请重试'
      })
      wx.showToast({
        title: '识别失败',
        icon: 'none'
      })
    }
  }
})
