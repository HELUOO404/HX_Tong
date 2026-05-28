const { REJECT_QUICK_PHRASES } = require('../../config/constants')

Component({
  properties: {
    show: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: '拒绝预约'
    },
    placeholder: {
      type: String,
      value: '请输入拒绝原因（必填）'
    },
    required: {
      type: Boolean,
      value: true
    },
    phrases: {
      type: Array,
      value: REJECT_QUICK_PHRASES
    }
  },

  data: {
    reason: '',
    phraseIndex: 0
  },

  observers: {
    show(val) {
      if (val) {
        this.setData({ reason: '', phraseIndex: 0 })
      }
    }
  },

  methods: {
    onInput(e) {
      this.setData({ reason: e.detail.value })
    },

    onPhrasePick(e) {
      const index = Number(e.detail.value)
      const phrases = this.properties.phrases || []
      const phrase = phrases[index]
      if (!phrase) return
      this.setData({ phraseIndex: index })
      this.appendPhrase(phrase)
    },

    appendPhrase(phrase) {
      const current = (this.data.reason || '').trim()
      const next = current ? `${current}；${phrase}` : phrase
      this.setData({ reason: next })
    },

    onCancel() {
      this.triggerEvent('cancel')
    },

    onConfirm() {
      const reason = (this.data.reason || '').trim()
      if (this.properties.required && !reason) {
        wx.showToast({ title: '请输入拒绝原因', icon: 'none' })
        return
      }
      this.triggerEvent('confirm', { reason })
    },

    onMaskTap() {
      this.onCancel()
    },

    preventBubble() {}
  }
})
