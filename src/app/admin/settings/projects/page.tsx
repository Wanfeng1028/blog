import { db } from "@/lib/db";
import { AdminProjectsPanel } from "@/features/admin/components/admin-projects-panel";

async function getAdminProjects() {
    const projectClient = (db as any).project;
    if (!projectClient || typeof projectClient.findMany !== "function") return [];
    try {
        const rows = await projectClient.findMany({
            orderBy: [{ order: "asc" }, { createdAt: "desc" }]
        });
        return rows as Array<{
            id: string;
            order: number;
            slug: string;
            title: string;
            subtitle: string;
            role: string;
            period: string;
            summary: string;
            highlights: unknown;
            techStack: string[];
            githubUrl: string | null;
            demoUrl: string | null;
            sourceRepo: string | null;
            likesCount: number;
            viewsCount: number;
            updatedAt: Date;
        }>;
    } catch {
        return [];
    }
}

export default async function AdminProjectsPage() {
    const projects = await getAdminProjects();

    return (
        <AdminProjectsPanel
            initialProjects={projects.map((item) => ({
                id: item.id,
                order: item.order,
                slug: item.slug,
                title: item.title,
                subtitle: item.subtitle,
                role: item.role,
                period: item.period,
                summary: item.summary,
                highlights: Array.isArray(item.highlights) ? (item.highlights as string[]) : [],
                techStack: item.techStack,
                githubUrl: item.githubUrl,
                demoUrl: item.demoUrl,
                sourceRepo: item.sourceRepo,
                content: null,
                likesCount: item.likesCount,
                viewsCount: item.viewsCount,
                updatedAt: item.updatedAt.toISOString()
            }))}
        />
    );
}
