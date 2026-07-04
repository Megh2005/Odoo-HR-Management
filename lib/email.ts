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

export const sendOrganizationCreationEmail = async (org: any, hrUser: any) => {
  try {
    let fieldsList: any[] = [];
    if (org.fields && Array.isArray(org.fields)) {
      fieldsList = org.fields;
    } else if (org.additionalInfo) {
      const infoObj = typeof org.additionalInfo.toObject === 'function'
        ? org.additionalInfo.toObject()
        : org.additionalInfo;
      fieldsList = Object.entries(infoObj).map(([key, value]) => ({ key, value }));
    }

    const customFieldsHtml = fieldsList.length > 0
      ? fieldsList.map((f: any) => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-weight: bold; color: #334155; width: 40%;">${f.key}</td>
            <td style="padding: 10px; color: #475569;">${f.value}</td>
          </tr>
        `).join("")
      : "";

    const logoHtml = org.logo
      ? `<div style="text-align: center; margin-bottom: 20px;">
          <img src="${org.logo}" alt="${org.name} Logo" style="max-width: 120px; max-height: 120px; border-radius: 12px; border: 2px solid #0f172a; object-fit: cover;" />
         </div>`
      : "";

    const mailOptions = {
      from: `"HR Management" <${process.env.SMTP_USER}>`,
      to: hrUser.email,
      subject: `Organization Created - ${org.name}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #0c4a6e; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 26px; font-weight: bold; letter-spacing: -0.5px;">Organization Setup Complete</h1>
            <p style="margin: 10px 0 0; font-size: 15px; color: #bae6fd;">Your workspace is ready to onboard employees.</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #0f172a; margin-top: 0;">Hello <strong>${hrUser.name}</strong>,</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.5;">Your organization, <strong>${org.name}</strong>, has been successfully created. Below are the details configured for your workspace:</p>
            
            ${logoHtml}

            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 25px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tbody>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold; color: #334155; width: 40%;">Company Name</td>
                    <td style="padding: 10px; color: #475569;">${org.name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px; font-weight: bold; color: #334155;">Address</td>
                    <td style="padding: 10px; color: #475569;">${org.address}</td>
                  </tr>
                  ${customFieldsHtml}
                </tbody>
              </table>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">[IMPORTANT] Check your spam folder if you don't receive emails from us. Important notifications might end up there.</p>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/organization/dashboard" style="background-color: #0c4a6e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; border: 2px solid #0f172a; display: inline-block;">Go to Organization Dashboard</a>
            </div>
          </div>

          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 5px;">This is an automated notification regarding your HR management workspace.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} HRSpecs. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Organization confirmation email sent successfully to", hrUser.email);
  } catch (error) {
    console.error("Error sending organization creation email:", error);
  }
};

export const sendEmployeeAdditionEmail = async (employee: any, org: any, hrUser: any) => {
  try {
    const signupUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/auth`;

    const mailOptions = {
      from: `"HR Management" <${process.env.SMTP_USER}>`,
      to: employee.email,
      subject: `Welcome to ${org.name} - Account Pre-Registered`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 2px solid #0f172a; border-radius: 16px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #0c4a6e; padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">Welcome to the Team!</h1>
            <p style="margin: 10px 0 0; font-size: 15px; color: #bae6fd;">Your employee workspace account has been pre-registered.</p>
          </div>
          
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #0f172a; margin-top: 0;">Hello <strong>${employee.name}</strong>,</p>
            <p style="font-size: 14px; color: #334155; line-height: 1.5;">You have been added to <strong>${org.name}</strong> as an employee by your HR Officer, <strong>${hrUser.name}</strong>.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 25px 0; text-align: center;">
              <p style="margin: 0 0 5px; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your Unique Employee ID</p>
              <h2 style="margin: 0; font-size: 28px; color: #0c4a6e; font-weight: 800; letter-spacing: 1px;">${employee.employeeId}</h2>
            </div>

            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #92400e; font-weight: 600;">[IMPORTANT] Check your spam folder if you don't receive future emails from us. Important notifications might end up there.</p>
            </div>

            <h3 style="font-size: 15px; color: #0f172a; margin-top: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;">How to Activate Your Account:</h3>
            <ol style="font-size: 14px; color: #475569; padding-left: 20px; line-height: 1.8;">
              <li>Go to the <a href="${signupUrl}" style="color: #0c4a6e; font-weight: bold; text-decoration: underline;">Registration Portal</a>.</li>
              <li>Select <strong>Register As: Employee</strong> from the dropdown.</li>
              <li>Choose your organization (<strong>${org.name}</strong>) and enter your registered email: <code>${employee.email}</code>.</li>
              <li>Verify the OTP sent to your inbox.</li>
              <li>Set your password and gender to complete activation!</li>
            </ol>

            <div style="text-align: center; margin-top: 35px;">
              <a href="${signupUrl}" style="background-color: #0c4a6e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; border: 2px solid #0f172a; display: inline-block;">Activate Your Account</a>
            </div>
          </div>

          <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 5px;">This email was sent from your company's HR Management system.</p>
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${org.name}. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("Employee addition email sent successfully to", employee.email);
  } catch (error) {
    console.error("Error sending employee addition email:", error);
  }
};
