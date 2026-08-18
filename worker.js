export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    // OPTIONS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    // GET /
    if (request.method === "GET" && url.pathname === "/") {
      return new Response(
        JSON.stringify({
          success: true,
          service: "Mandoub API",
          status: "online"
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders
          }
        }
      );
    }

    // POST /api/otp
    if (request.method === "POST" && url.pathname === "/api/otp") {
      try {
        const body = await request.json();

        const email = body.email;

        if (!email) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Email is required"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        // إنشاء كود تحقق من 6 أرقام
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // حفظ الكود مؤقتًا في KV إذا كان مربوطًا لاحقًا
        if (env.OTP_KV) {
          await env.OTP_KV.put(
            `otp:${email}`,
            otp,
            { expirationTtl: 600 }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            message: "Verification code generated",
            email: email,
            otp: otp
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }

    // POST /api/verify
    if (request.method === "POST" && url.pathname === "/api/verify") {
      try {
        const body = await request.json();

        const email = body.email;
        const otp = body.otp;

        if (!email || !otp) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "Email and OTP are required"
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        if (!env.OTP_KV) {
          return new Response(
            JSON.stringify({
              success: false,
              error: "OTP_KV is not configured"
            }),
            {
              status: 500,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        const savedOtp = await env.OTP_KV.get(`otp:${email}`);

        if (!savedOtp || savedOtp !== otp.toString()) {
          return new Response(
            JSON.stringify({
              success: false,
              verified: false,
              error: "Invalid or expired verification code"
            }),
            {
              status: 401,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }

        await env.OTP_KV.delete(`otp:${email}`);

        return new Response(
          JSON.stringify({
            success: true,
            verified: true,
            message: "Verification successful"
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Not Found"
      }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
};
