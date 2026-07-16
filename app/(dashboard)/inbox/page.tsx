import { Button } from "@/components/ui/button";
import path from "path";
const mock_data = [
    {
        id: 1,
        send: "Lê Phan Nhật Huy",
        filename: "skibidisigma.zip",
        path: "uploads/skibidisigma.zip",
    },
    {
        id: 2,
        send: "Nguyễn Văn Rizzler",
        filename: "ohio_gyatt_detected.zip",
        path: "uploads/ohio_gyatt_detected.zip",
    },
    {
        id: 3,
        send: "Trần Hoàng Mewing",
        filename: "mogging_streak_100.zip",
        path: "uploads/mogging_streak_100.zip",
    },
    {
        id: 4,
        send: "Phạm Minh Grimace",
        filename: "shake_protocol_v2.zip",
        path: "uploads/shake_protocol_v2.zip",
    },
    {
        id: 5,
        send: "Đặng Tuấn BabyJohn",
        filename: "looksmaxxing_guide.zip",
        path: "uploads/looksmaxxing_guide.zip",
    },
];

export default function Inbox() {
    return (
        <div className="py-10">
            <h1 className="text-2xl">Xin chào User👋</h1>
            <main className="mt-10">
                <h1 className="font-bold text-3xl">Inbox</h1>
                <div className="bg-secondary w-full h-200 rounded-lg mt-5 flex flex-col">
                    {mock_data.map((item) => (
                        <div
                            key={item.id}
                            className="w-full p-5 hover:bg-gray-200 rounded-md flex justify-between items-center"
                        >
                            <h1 className="font-medium text-xl">{item.send}</h1>
                            <p className="underline text-primary">{item.filename}</p>
                            <Button size={"xs"} className="cursor-pointer">
                                Tải xuống
                            </Button>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
