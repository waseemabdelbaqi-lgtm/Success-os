export const paymentGateways=[
 {group:'بطاقات ومحافظ عالمية',items:['Stripe','PayPal','Adyen','Checkout.com','Braintree','Worldpay','2Checkout / Verifone','Authorize.net','Square','Amazon Pay','Google Pay','Apple Pay','Klarna','Afterpay / Clearpay','Skrill','Neteller','Paysafe']},
 {group:'الشرق الأوسط وشمال أفريقيا',items:['HyperPay','PayTabs','Amazon Payment Services','MyFatoorah','Tap Payments','Moyasar','Telr','Network International','Geidea','Paymob','Fawry','MadfooatCom / eFAWATEERcom','Zain Cash','Orange Money','CliQ']},
 {group:'آسيا والمحيط الهادئ',items:['Alipay','WeChat Pay','UnionPay','Razorpay','PayU','Cashfree Payments','PhonePe','Paytm','GrabPay','GCash','Maya','Xendit','Midtrans','Airwallex']},
 {group:'أوروبا وأفريقيا وأمريكا اللاتينية',items:['Mollie','SEPA Direct Debit','iDEAL','Bancontact','Giropay','Sofort','Flutterwave','Paystack','M-Pesa','Mercado Pago','dLocal','PagSeguro','EBANX','Pix']},
 {group:'تحويلات ودفع يدوي',items:['تحويل بنكي','حوالة محلية','الدفع في المركز']}
];

export const gatewayNames=paymentGateways.flatMap(group=>group.items);
