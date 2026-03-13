-- Clean up stuck test jobs from job_queue
DELETE FROM job_queue WHERE attempts > 0;