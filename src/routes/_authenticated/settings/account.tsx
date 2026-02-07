import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@workos/authkit-tanstack-react-start/client";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/_authenticated/settings/account")({
	component: AccountSettings,
});

function AccountSettings() {
	const { user } = useAuth();

	return (
		<div className="space-y-8">
			<div>
				<h1 className="font-semibold text-2xl tracking-tight">Account</h1>
				<p className="text-muted-foreground text-sm">
					Manage your account and security.
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>
						Your profile information from your sign-in provider.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<div className="flex items-center gap-4">
						<Avatar className="size-14">
							<AvatarImage
								src={user?.profilePictureUrl ?? undefined}
								alt={`${user?.firstName} ${user?.lastName}`}
							/>
							<AvatarFallback>
								{user?.firstName?.[0]}
								{user?.lastName?.[0]}
							</AvatarFallback>
						</Avatar>
						<div className="grid gap-1 text-sm">
							<div className="font-medium">
								{user?.firstName} {user?.lastName}
							</div>
							<div className="text-muted-foreground">{user?.email}</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Security &amp; data</CardTitle>
					<CardDescription>
						Change password, export your data, or delete your account.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<Separator />
					<div>
						<p className="mb-2 text-muted-foreground text-sm">
							Permanently delete your account and all associated data. This
							action cannot be undone.
						</p>
						<Button
							variant="destructive-ghost"
							size="default"
							onClick={() =>
								toast.info("Delete account is not implemented yet.")
							}
						>
							Delete account
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
