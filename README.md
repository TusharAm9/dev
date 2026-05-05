## SwiftTask - Modern Task Management

**SwiftTask** is a full-stack, high-performance task management application built with **Next.js 15**, **TypeScript**, and **Supabase**. This project was engineered to showcase efficient UI/UX design and robust database architecture for professional task tracking.

---

### ## Core Features
*   **Secure Authentication**: Integrated with Supabase Auth for seamless user login and signup.
*   **Real-time Database**: Leverages PostgreSQL (via Supabase) for instant data persistence and retrieval.
*   **Responsive UI**: Built with Tailwind CSS and modular components for a fluid experience across all devices.
*   **Sync Logic**: Features a custom `/api/auth/sync` route to synchronize authentication states with backend user profiles.
*   **Digital Architecture**: Utilizes high-fidelity mockups and responsive wireframes to ensure professional-grade user interaction.

---

### ## Tech Stack
| Category | Technology |
| :--- | :--- |
| **Framework** | Next.js 15 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Backend/Auth** | Supabase |
| **Database** | PostgreSQL |
| **Deployment** | Vercel / Railway |

---

### ## Getting Started

#### 1. Clone the repository
```bash
git clone https://github.com/TusharAm9/dev.git
cd dev
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add the following:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

### ## Deployment Configuration

#### Vercel
This project is optimized for Vercel. Ensure your **Site URL** in Supabase matches your Vercel deployment URL to avoid authentication redirect issues.

#### Railway
To deploy on Railway:
1.  Ensure your `package.json` start script is: `"start": "next start -p ${PORT:-3000}"`.
2.  Set the **Health Check Timeout** to 60 seconds in the service settings.
3.  Configure all environment variables in the Railway dashboard.

---

### ## Project History
*   **Engineered** for digital branding and administrative efficiency.
*   **Transitioned** from a multi-backend approach to a streamlined Supabase-native architecture to optimize production performance.
*   **Architected** by a full-stack developer focused on hospitality and retail digital solutions.
