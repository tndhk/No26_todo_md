import { NextResponse } from 'next/server';
import { getAllProjects } from '@/lib/markdown';
import { apiLogger, logError } from '@/lib/logger';
import { startApiTransaction, generateRequestId } from '@/lib/monitoring';
import * as Sentry from '@sentry/nextjs';

/**
 * GET /api/v1/projects
 * Returns all projects with their tasks
 */
export async function GET() {
    const requestId = generateRequestId();
    const transaction = startApiTransaction({
        method: 'GET',
        path: '/api/v1/projects',
        requestId,
    });

    try {
        const projects = await getAllProjects();
        transaction.end(200, { projectCount: projects.length });
        return NextResponse.json(projects);
    } catch (error) {
        logError(error, { operation: 'GET /api/v1/projects', requestId }, apiLogger);
        Sentry.captureException(error, { extra: { requestId } });
        transaction.end(500);
        return NextResponse.json(
            { error: 'Failed to read projects' },
            { status: 500 }
        );
    }
}
