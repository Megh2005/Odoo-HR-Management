import { transporter } from "@/lib/mailer";

const generateItemsHtml = (items: any[]) => {
  return items
    .map(
      (item: any, index: number) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px; text-align: left;">${index + 1}</td>
        <td style="padding: 10px; text-align: left;">${item.name}</td>
        <td style="padding: 10px; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right;">₹${item.price}</td>
        <td style="padding: 10px; text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `
    )
    .join("");
};

export const sendOrderConfirmation = async (order: any, user: any) => {
  try {
    const itemsHtml = generateItemsHtml(order.items);

    const mailOptions = {
      from: `"HRSpecs Orders" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Order Confirmation - #${order._id.toString().slice(-6).toUpperCase()}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #0284c7; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">Order Confirmed!</h1>
            <p style="margin: 10px 0 0; font-size: 14px;">Thank you for your purchase.</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your order has been placed successfully. Here are the details:</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
              <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${order.paymentId}</p>
              <p style="margin: 5px 0;"><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 10px; text-align: left;">#</th>
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Grand Total:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; color: #0284c7;">₹${order.totalAmount}</td>
                </tr>
              </tfoot>
            </table>

            <div style="margin-top: 30px;">
              <p style="font-weight: bold; margin-bottom: 10px;">Delivery Address:</p>
              <p style="margin: 0; color: #64748b;">
                ${order.shippingAddress.landmark}<br>
                ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}
              </p>
            </div>
          </div>

          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} HRSpecs. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending order email:", error);
  }
};

export const sendOrderStatusUpdateEmail = async (order: any, user: any, estimatedDate?: string) => {
  try {
    const itemsHtml = generateItemsHtml(order.items);
    const statusColor = order.status === 'Cancelled' ? '#ef4444' : '#0284c7'; // Red for cancel, Blue for others
    const statusTitle = order.status === 'Cancelled' ? 'Order Cancelled' : `Order ${order.status}`;

    const mailOptions = {
      from: `"HRSpecs Orders" <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: `Order Update - #${order._id.toString().slice(-6).toUpperCase()} is ${order.status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
          <div style="background-color: ${statusColor}; padding: 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px;">${statusTitle}</h1>
            <p style="margin: 10px 0 0; font-size: 14px;">Your order status has been updated.</p>
          </div>
          
          <div style="padding: 20px;">
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your order #${order._id.toString().slice(-6).toUpperCase()} is now <strong>${order.status}</strong>.</p>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Order ID:</strong> #${order._id.toString().slice(-6).toUpperCase()}</p>
              <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${order.paymentId}</p>
              <p style="margin: 5px 0;"><strong>Current Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${order.status}</span></p>
              ${estimatedDate ? `<p style="margin: 5px 0;"><strong>Estimated Delivery:</strong> ${new Date(estimatedDate).toLocaleDateString()}</p>` : ''}
            </div>

            <p style="font-weight: bold; margin-bottom: 10px;">Order Details:</p>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 10px; text-align: left;">#</th>
                  <th style="padding: 10px; text-align: left;">Item</th>
                  <th style="padding: 10px; text-align: center;">Qty</th>
                  <th style="padding: 10px; text-align: right;">Price</th>
                  <th style="padding: 10px; text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="padding: 10px; text-align: right; font-weight: bold;">Grand Total:</td>
                  <td style="padding: 10px; text-align: right; font-weight: bold; color: #0284c7;">₹${order.totalAmount}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
             <p style="margin: 0;">&copy; ${new Date().getFullYear()} HRSpecs. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending status email:", error);
  }
};
