import { getSessionUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getShopMembers } from '@/app/data/shop.data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IconUserPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { InviteMemberDialog } from '@/app/(seller)/seller/shops/[shopId]/members/_components/invite-member-dialog';
import { RemoveMemberButton } from '@/app/(seller)/seller/shops/[shopId]/members/_components/remove-member-button';

interface MemberPageProps {
  params: Promise<{ shopId: string }>;
}

export default async function ShopMemberPage({ params }: MemberPageProps) {
  const { shopId } = await params;
  const session = await getSessionUser();

  if (!session) {
    redirect('/auth/login');
  }

  const shop = await getShopMembers(shopId);

  if (!shop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-red-600 mb-2">Shop not found</h1>
        <p>
          The shop you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have access.
        </p>
      </div>
    );
  }

  const { loadSubject } = await import('@/lib/authz/load');
  const { can } = await import('@/lib/authz/policy');
  const subject = await loadSubject(session.user.id);

  const canManageTeam =
    shop.ownerId === session.user.id ||
    (subject ? can(subject, 'shop:members:manage', { targetShopId: shopId }) : false) ||
    (subject ? can(subject, '*') : false);

  const canInviteTeam =
    canManageTeam ||
    (subject ? can(subject, 'shop:members:invite', { targetShopId: shopId }) : false);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              {shop.name} - Members
            </CardTitle>
            <CardDescription>
              Manage your shop team members and their roles
            </CardDescription>
          </div>
          {canInviteTeam && <InviteMemberDialog shopId={shopId} />}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Joined Date</TableHead>
                {canManageTeam && (
                  <TableHead className="text-right">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shop.members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canManageTeam ? 5 : 4}
                    className="text-center h-24 text-muted-foreground"
                  >
                    No members found. Invite team members to collaborate.
                  </TableCell>
                </TableRow>
              ) : (
                shop.members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={member.user.image ?? undefined}
                            alt={member.user.name}
                          />
                          <AvatarFallback>
                            {member.user.name[0]?.toUpperCase() ?? (
                              <IconUserPlus />
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{member.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role === 'OWNER' ? 'default' : 'secondary'
                        }
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    {canManageTeam && (
                      <TableCell className="text-right">
                        {member.role !== 'OWNER' && (
                          <RemoveMemberButton
                            shopId={shopId}
                            memberId={member.id}
                            memberName={member.user.name || member.user.email}
                          />
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
