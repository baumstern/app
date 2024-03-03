import { LoaderFunctionArgs, json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { User } from "types/user";
import Header from "~/components/header";
import { requireAuthedUser } from "~/lib/services/auth.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const user = (await requireAuthedUser(request)) as User;
	return json({
		user,
	});
}

export default function AppIndex() {
	const { user } = useLoaderData<typeof loader>();

	return (
		<main className="flex min-h-screen flex-col items-center gap-y-12 p-8">
			<Header user={user} />
			<div className="flex h-full flex-col items-center pt-[32vh]">
				<Outlet />
			</div>
		</main>
	);
}
