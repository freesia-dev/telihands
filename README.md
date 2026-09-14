# Telihands

{

  "project_name": "Telihan Digital Signage",

  "project_type": "Web Application",

  "description": "Build a modern web-based digital signage platform for Bank KCP Telihan that is fully compatible with Android TV kiosk mode. The application must support displaying banking product interest rates, deposito information, promotional videos and images, and provide a fully responsive admin panel for managing all signage content remotely from mobile or desktop devices.", Use logo that i upload

  "design_style": {

    "theme": "Modern Banking Dashboard",

    "primary_colors": [

      "#0B5ED7",

      "#1E3A8A",

      "#F59E0B",

      "#FDBA12",

      "#FFFFFF"

    ],

    "style": [

      "clean",

      "minimalist",

      "modern",

      "premium",

      "high contrast",

      "responsive"

    ],

    "font_family": [

      "Poppins",

      "Inter",

      "Montserrat"

    ],

    "animation": "smooth subtle transitions using Framer Motion"

  },

  "pages": [

    {

      "name": "Login Page",

      "route": "/login",

      "features": [

        "email login",

        "password login",

        "modern banking UI",

        "responsive mobile layout",

        "secure authentication form"

      ]

    },

    {

      "name": "Admin Dashboard",

      "route": "/dashboard",

      "features": [

        "summary cards",

        "media statistics",

        "active display status",

        "latest uploaded media",

        "quick actions",

        "responsive layout"

      ]

    },

    {

      "name": "Savings Product Management",

      "route": "/products",

      "features": [

        "CRUD savings products",

        "interest rate management",

        "activate/deactivate products",

        "table view",

        "responsive cards for mobile"

      ],

      "default_products": [

        "Tabungan Prama",

        "Tabungan Simpeda",

        "Tabungan TabunganKu",

        "Tabungan SimPel",

        "Giro"

      ]

    },

    {

      "name": "Deposito Management",

      "route": "/deposito",

      "features": [

        "CRUD deposito rates",

        "custom layout styling",

        "tenor management",

        "interest rate management",

        "promo section"

      ]

    },

    {

      "name": "Media Management",

      "route": "/media",

      "features": [

        "upload videos",

        "upload images",

        "media playlist",

        "drag and drop upload",

        "media preview",

        "activate/deactivate media",

        "scheduling support"

      ]

    },

    {

      "name": "Layout Management",

      "route": "/layouts",

      "features": [

        "dynamic layout editor",

        "drag and drop widgets",

        "split screen layout",

        "fullscreen media layout",

        "live preview"

      ]

    },

    {

      "name": "Running Text Management",

      "route": "/running-text",

      "features": [

        "CRUD running text",

        "announcement management",

        "ticker configuration"

      ]

    },

    {

      "name": "Display Screen",

      "route": "/display/main",

      "features": [

        "fullscreen Android TV mode",

        "autoplay video",

        "slideshow images",

        "display savings interest rates",

        "display deposito rates",

        "running text ticker",

        "smooth animation",

        "auto refresh",

        "optimized for Android TV landscape mode"

      ]

    }

  ],

  "display_layout": {

    "type": "split-screen",

    "layout": {

      "top": {

        "component": "media_slider",

        "height": "65%"

      },

      "bottom_left": {

        "component": "savings_interest_rates",

        "width": "50%"

      },

      "bottom_right": {

        "component": "deposito_rates",

        "width": "50%"

      },

      "footer": {

        "component": "running_text",

        "height": "50px"

      }

    }

  },

  "technical_requirements": {

    "frontend": [

      "ReactJS",

      "NextJS",

      "TailwindCSS",

      "Framer Motion"

    ],

    "backend": [

      "Supabase"

    ],

    "storage": [

      "Supabase Storage"

    ],

    "authentication": [

      "Supabase Auth"

    ],

    "hosting": [

      "Vercel"

    ]

  },

  "android_tv_compatibility": {

    "requirements": [

      "fullscreen support",

      "responsive landscape layout",

      "auto video playback",

      "optimized rendering",

      "auto refresh support",

      "compatible with Fully Kiosk Browser",

      "no scrollbars",

      "touch-friendly admin panel"

    ]

  },

  "responsive_requirements": {

    "devices": [

      "Android TV",

      "Desktop",

      "Tablet",

      "Mobile"

    ],

    "mobile_usage": "Admin panel should work as a remote control dashboard from smartphones."

  },

  "future_features": [

    "multi branch support",

    "multiple display screens",

    "content scheduling",

    "analytics dashboard",

    "emergency announcements",

    "display monitoring",

    "QR code integration"

  ]

}

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://telihands.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e40a1e66-ff9d-48ce-8cff-77bff2c4dda5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
