import { Shield, Cpu, Clock } from "lucide-react"; // Hoặc dùng icon của bạn

export default function FeaturesSection() {
    const cards = [
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Mã hoá đầu cuối phong bì",
            desc: "ECDH P-256 tạo khoá đối xứng tạm thời bảo vệ khóa file K_file bằng AES-256-GCM, nén kép metadata đảm bảo chỉ người có Private Key hợp lệ mới xem được.",
        },
        {
            icon: <Cpu className="w-6 h-6" />,
            title: "Mật mã học 5 tầng tuần tự",
            desc: "Dữ liệu pixel sau khi xáo trộn và bitwise XNOR sẽ đi qua 3 lớp AES-CBC 256-bit và 2 lớp 3DES-CBC 192-bit tăng độ khuếch tán entropy lên mức tối đa.",
        },
        {
            icon: <Clock className="w-6 h-6" />,
            title: "Kiến trúc Zero-Knowledge",
            desc: "Không bao giờ lưu trữ ảnh, khoá hay tệp nén của bạn. Quy trình xử lý chuyển đổi dữ liệu diễn ra hoàn toàn trên bộ nhớ đệm luồng Express và tự hủy ngay lập tức.",
        },
    ];

    return (
        <div className="col-span-12 gap-5 w-full bg-gray-50 py-16 flex rounded-lg flex-col items-center justify-center">
            <h1 className="text-slate-700 font-bold text-4xl mb-5">Tại sao chọn CyberShield?</h1>
            <p className="max-w-2xl text-center font-medium text-slate-600 mb-12 text-sm md:text-base leading-relaxed">
                Chúng tôi áp dụng mô hình toán học chuẩn hóa kết hợp với hoán vị ngẫu nhiên cấu trúc
                pixel và mật mã học phong bì để bảo vệ trọn vẹn dữ liệu.
            </p>
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        className="group hover:border-blue-900 transition-colors duration-300 bg-white border border-slate-200 rounded-2xl p-8 flex flex-col items-start h-full shadow-sm"
                    >
                        {/* Box chứa Icon */}
                        <div className="group-hover:scale-110 group-hover:text-blue-900 text-slate-800 transition-all duration-300 p-3 bg-blue-50 rounded-xl mb-6 flex items-center justify-center">
                            {card.icon}
                        </div>

                        {/* Tiêu đề Card */}
                        <h3 className="text-xl font-bold text-slate-800 mb-4 tracking-tight">
                            {card.title}
                        </h3>

                        {/* Nội dung mô tả */}
                        <p className="text-slate-600 text-sm font-medium leading-relaxed text-justify">
                            {card.desc}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
