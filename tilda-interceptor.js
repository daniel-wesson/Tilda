const TildaInterceptor = function (freshUrl)
{
	const _this = this

	this.freshUrl = freshUrl

	this.parseXhrData = function (xhrData)
	{
		const params = xhrData.split('&')
		let result = {}

		for (const pair of params) {
			const a = pair.split('=')
			const key = decodeURIComponent(a.shift())
			const value = decodeURIComponent(a.join('='))
			result[key] = value
		}

		return result
	}

	this.formatOrder = function (payment)
	{
		let result = {}
		result['Общая сумма заказа'] = payment.amount
		let orderDetails = ''

		for (const product of payment.products) {
			let productName = product.name.replace(/\+/g, ' ').replace(/&quot;/g, '\"')
			orderDetails += `${productName}\n`
			orderDetails += `Количество: ${product.quantity}\n`
			orderDetails += `Цена (за 1 шт): ${product.price}\n`
			orderDetails += `ID товара: ${product.lid}\n\n`
		}
		result['Детали заказа'] = orderDetails

		return result
	}

	this.refreshData = function (requestData)
	{
		let result = {}

		for (const key in requestData) {
			const value = requestData[key]

			if (key.match(/(^tilda)|(form-spec-comments)|(^formservices)/gm))
				continue

			result[key] = value
		}

		if (requestData.hasOwnProperty('tildapayment')) {
			const paymentData = JSON.parse(requestData['tildapayment'])
			const a = _this.formatOrder(paymentData)
			Object.assign(result, a)
		}

		return result
	}

	this.handleXhr = function (xhr, request)
	{
		const triggers = ['forms.tildacdn.com', 'forms2.tildacdn.com']

		const redirectUrl = triggers.find(function (item) {
			return request.url.split('?')[0].indexOf(item) >= 0
		})

		if (redirectUrl) {
			xhr.abort()
			request.url = this.freshUrl
			const normalizedData = _this.parseXhrData(request.data)
			request.data = _this.refreshData(normalizedData)
			$.ajax(request)
		}
	}

	$.ajaxSetup({
		beforeSend: function (xhr, request) {
			_this.handleXhr(xhr, request)
		}
	})
}
