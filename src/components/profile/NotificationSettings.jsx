import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { Bell } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MESSAGES } from "../../utils/constants/messages";

export function NotificationSettings() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    smsAlerts: false,
    priceAlerts: true,
    orderUpdates: true,
    marketNews: false,
    sipReminders: true,
  });

  const handleSaveNotifications = () => {
    toast.success(MESSAGES.PROFILE.PREFERENCES_SAVED);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Email Alerts</p>
            <p className="text-sm text-muted-foreground">
              Receive notifications via email
            </p>
          </div>
          <Switch
            checked={notifications.emailAlerts}
            onCheckedChange={(checked) =>
              setNotifications({
                ...notifications,
                emailAlerts: checked,
              })
            }
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">SMS Alerts</p>
            <p className="text-sm text-muted-foreground">
              Receive notifications via SMS
            </p>
          </div>
          <Switch
            checked={notifications.smsAlerts}
            onCheckedChange={(checked) =>
              setNotifications({ ...notifications, smsAlerts: checked })
            }
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Price Alerts</p>
            <p className="text-sm text-muted-foreground">
              Get notified when stocks hit target prices
            </p>
          </div>
          <Switch
            checked={notifications.priceAlerts}
            onCheckedChange={(checked) =>
              setNotifications({
                ...notifications,
                priceAlerts: checked,
              })
            }
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Order Updates</p>
            <p className="text-sm text-muted-foreground">
              Notifications for order executions
            </p>
          </div>
          <Switch
            checked={notifications.orderUpdates}
            onCheckedChange={(checked) =>
              setNotifications({
                ...notifications,
                orderUpdates: checked,
              })
            }
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Market News</p>
            <p className="text-sm text-muted-foreground">
              Daily market updates and news
            </p>
          </div>
          <Switch
            checked={notifications.marketNews}
            onCheckedChange={(checked) =>
              setNotifications({
                ...notifications,
                marketNews: checked,
              })
            }
          />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">SIP Reminders</p>
            <p className="text-sm text-muted-foreground">
              Reminders before SIP execution
            </p>
          </div>
          <Switch
            checked={notifications.sipReminders}
            onCheckedChange={(checked) =>
              setNotifications({
                ...notifications,
                sipReminders: checked,
              })
            }
          />
        </div>
        <Button onClick={handleSaveNotifications}>Save Preferences</Button>
      </CardContent>
    </Card>
  );
}
